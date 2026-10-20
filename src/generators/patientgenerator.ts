import type { Patient, PatientPriority, ResourceType, PersonnelType, PatientResourcesNeeded } from "../models/Patient.js";
import type { WorkloadProfile } from "../models/WorkloadProfile.js";
import { SeededRandom } from "../random/seededrandom.js";
import { TRIAGE_TREATMENT_MEAN_MINUTES } from "../constants/edModel.js";

export class PatientGenerator {
    private random_seed: SeededRandom;
    private profile: WorkloadProfile;

    constructor(random_seed: SeededRandom, profile: WorkloadProfile) {
        this.random_seed = random_seed;
        this.profile = profile;
    }

    private isWithinSurge(arrivalTimeMinutes: number): boolean {
        const surge = this.profile.surge;

        if (!surge) {
            return false;
        }

        const surgeStartMinutes = surge.start_hour * 60;
        const surgeEndMinutes = surgeStartMinutes + (surge.duration_hours * 60);

        return arrivalTimeMinutes >= surgeStartMinutes && arrivalTimeMinutes < surgeEndMinutes;
    }

    private getPriorityDistributionForArrival(arrivalTimeMinutes: number): WorkloadProfile["priority_distribution"] {
        if (this.isWithinSurge(arrivalTimeMinutes)) {
            return this.profile.surge!.priority_distribution;
        }

        return this.profile.priority_distribution;
    }

    private getArrivalRateForTime(arrivalTimeMinutes: number): number {
        if (this.isWithinSurge(arrivalTimeMinutes)) {
            return this.profile.surge!.patient_rate;
        }

        return this.profile.patient_rate;
    }

    private getNextRateBoundary(arrivalTimeMinutes: number): number | null {
        const surge = this.profile.surge;

        if (!surge) {
            return null;
        }

        const surgeStartMinutes = surge.start_hour * 60;
        const surgeEndMinutes = surgeStartMinutes + (surge.duration_hours * 60);

        if (arrivalTimeMinutes < surgeStartMinutes) {
            return surgeStartMinutes;
        }

        if (arrivalTimeMinutes < surgeEndMinutes) {
            return surgeEndMinutes;
        }

        return null;
    }

    private sampleInterarrivalTime(patientRatePerHour: number): number {
        const random = this.random_seed.next();
        const ratePerMinute = patientRatePerHour / 60;

        return -Math.log(1 - random) / ratePerMinute;
    }

    private generatePriority(arrivalTime: number): PatientPriority {
        const random = this.random_seed.next();
        const distribution = this.getPriorityDistributionForArrival(arrivalTime);

        let cumulative = distribution.non_urgent;

        if (random < cumulative) {
            return "non_urgent";
        }

        cumulative += distribution.less_urgent;

        if (random < cumulative) {
            return "less_urgent";
        }

        cumulative += distribution.urgent;

        if (random < cumulative) {
            return "urgent";
        }

        cumulative += distribution.emergent;

        if (random < cumulative) {
            return "emergent";
        }

        return "resuscitation";
    }

    private generateTreatmentTime(priority: PatientPriority): number {
        const mean = TRIAGE_TREATMENT_MEAN_MINUTES[priority];
        const min = mean * 0.5;
        const max = mean * 1.5;

        return this.random_seed.range(min, max);
    }

    private usesIsolationRoom(priority: PatientPriority): boolean {
        if (priority === "resuscitation") {
            return false;
        }

        return this.random_seed.next() < this.profile.isolation_probability;
    }

    private generateAge(): number {
        return this.random_seed.integer(1, 100);
    }

    private generatePersonnelNeeded(priority: PatientPriority): Partial<Record<PersonnelType, number>> {
        const needed: Partial<Record<PersonnelType, number>> = {
            physician: 1
        };

        if (priority === "resuscitation") {
            needed.nurse = 4;
            return needed;
        }

        if (priority === "emergent") {
            needed.nurse = 2;
            return needed;
        }

        needed.nurse = 1;
        return needed;
    }

    private generateResourcesNeeded(priority: PatientPriority): Partial<Record<ResourceType, number>> {
        const resources: Partial<Record<ResourceType, number>> = {};

        if (priority === "resuscitation") {
            resources.resus_bay = 1;
            return resources;
        }

        if (this.usesIsolationRoom(priority)) {
            resources.isolation_room = 1;
        } else {
            resources.ed_bed = 1;
        }

        return resources;
    }

    // Uses the active rate for the current time, and if an interval crosses a boundary,
    // jumps to that boundary and resamples with the new rate.
    private generateInterarrivalTime(currentArrivalTime: number): number {
        let elapsed = 0;
        let cursorTime = currentArrivalTime;

        while (true) {
            const activeRate = this.getArrivalRateForTime(cursorTime);
            const sampledInterval = this.sampleInterarrivalTime(activeRate);
            const nextBoundary = this.getNextRateBoundary(cursorTime);

            if (nextBoundary === null || cursorTime + sampledInterval <= nextBoundary) {
                return elapsed + sampledInterval;
            }

            elapsed += nextBoundary - cursorTime;
            cursorTime = nextBoundary;
        }
    }

    private generatePatient(id: number, arrivalTime: number): Patient {

        const priority = this.generatePriority(arrivalTime);
        const resources = this.generateResourcesNeeded(priority);
        const personnel = this.generatePersonnelNeeded(priority);

        const patient: Patient = {

            id: id,

            name: `Patient-${id}`,

            age: this.generateAge(),

            arrivalTime: arrivalTime,

            estimatedTreatmentTime:
                this.generateTreatmentTime(priority),

            priority: priority,

            resourcesNeeded: {
                resources: resources,
                personnel: personnel
            }
        };

        return patient;
    }


    generatePatients(count: number): Patient[] {

        const patients: Patient[] = [];

        let arrivalTime = 0;

        for (let i = 1; i <= count; i++) {

            arrivalTime += this.generateInterarrivalTime(arrivalTime);

            const patient =
                this.generatePatient(i, arrivalTime);

            patients.push(patient);
        }

        return patients;
    }
}
