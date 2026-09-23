import type { Patient, PatientPriority, ResourceType, PersonnelType, PatientResourcesNeeded } from "../models/patient";
import type { WorkloadProfile } from "../models/workloadprofile";
import { SeededRandom } from "../random/seededrandom";

export class PatientGenerator {
    private random_seed: SeededRandom;
    private profile: WorkloadProfile;

    constructor(random_seed: SeededRandom, profile: WorkloadProfile) {
        this.random_seed = random_seed;
        this.profile = profile;
    }

    private generatePriority(): PatientPriority {
        const random = this.random_seed.next();
        const distribution = this.profile.priority_distribution;

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

    const ranges = this.profile.treatment_range;

    switch (priority) {

        case "non_urgent":
            return this.random_seed.range(ranges.non_urgent_range.min, ranges.non_urgent_range.max);

        case "less_urgent":
            return this.random_seed.range(ranges.less_urgent_range.min, ranges.less_urgent_range.max);

        case "urgent":
            return this.random_seed.range(ranges.urgent_range.min, ranges.urgent_range.max);

        case "emergent":
            return this.random_seed.range(ranges.emergent_range.min, ranges.emergent_range.max);

        case "resuscitation":
            return this.random_seed.range(ranges.resuscitation_range.min, ranges.resuscitation_range.max);
        }
    }

    private generateResourcesNeeded(): Partial<Record<ResourceType, number>> {
    const probabilities = this.profile.resource_probability;

    const resources: Partial<Record<ResourceType, number>> = {};

    const resourceTypes: ResourceType[] = [
        "general_ward_bed",
        "icu_bed",
        "operating_room",
        "isolation_room",
        "imaging_room"
    ];

    for (const resource of resourceTypes) {
        if (this.random_seed.next() < probabilities[resource]) {
            resources[resource] = 1;
        }
    }

    return resources;
    }

    private generateAge(): number {
        return this.random_seed.integer(1, 100);
    }

    private generatePersonnelNeeded(priority: PatientPriority): Partial<Record<PersonnelType, number>> {

    if (priority === "resuscitation") {
        return {
            physician: 1,
            nurse: 2
        };
    }

    if (priority === "emergent") {
        return {
            physician: 1,
            nurse: 1
        };
    }

    return {
        nurse: 1
    };
    }

    // generates rate at which patients arrive at the hospital based on the patient rate defined in the workload profile.
    private generateInterarrivalTime(): number {

        const random = this.random_seed.next();

        const ratePerMinute = this.profile.patient_rate / 60;

        return -Math.log(1 - random) / ratePerMinute;
    }

    private generatePatient(id: number, arrivalTime: number): Patient {

        const priority = this.generatePriority();

        const patient: Patient = {

            id: id,

            name: `Patient-${id}`,

            age: this.generateAge(),

            arrivalTime: arrivalTime,

            estimatedTreatmentTime:
                this.generateTreatmentTime(priority),

            priority: priority,

            resourcesNeeded: {
                resources: this.generateResourcesNeeded(),
                personnel: this.generatePersonnelNeeded(priority)
            }
        };

        return patient;
    }


    generatePatients(count: number): Patient[] {

        const patients: Patient[] = [];

        let arrivalTime = 0;

        for (let i = 1; i <= count; i++) {

            arrivalTime += this.generateInterarrivalTime();

            const patient =
                this.generatePatient(i, arrivalTime);

            patients.push(patient);
        }

        return patients;
    }
}
