import { describe, expect, it } from "vitest";
import { MassCasualtyProfile, NormalProfile } from "../src/config/Workloadprofiles";
import { PatientGenerator } from "../src/generators/patientgenerator";
import { SeededRandom } from "../src/random/seededrandom";
import { TRIAGE_TREATMENT_MEAN_MINUTES } from "../src/constants/edModel";

describe("PatientGenerator", () => {
    it("uses the same seed to produce the same patient list", () => {
        const generator1 = new PatientGenerator(new SeededRandom(42), NormalProfile);
        const generator2 = new PatientGenerator(new SeededRandom(42), NormalProfile);

        const patients1 = generator1.generatePatients(30);
        const patients2 = generator2.generatePatients(30);

        expect(patients1).toEqual(patients2);
    });

    it("assigns fixed needs by triage and uses isolation room instead of ED bed", () => {
        const generator = new PatientGenerator(new SeededRandom(77), NormalProfile);
        const patients = generator.generatePatients(2000);

        for (const patient of patients) {
            const resources = patient.resourcesNeeded.resources;
            const personnel = patient.resourcesNeeded.personnel;

            if (patient.priority === "resuscitation") {
                expect(resources.resus_bay).toBe(1);
                expect(resources.ed_bed).toBeUndefined();
                expect(resources.isolation_room).toBeUndefined();
                expect(personnel.nurse).toBe(4);
                expect(personnel.physician).toBe(1);
            }

            if (patient.priority === "emergent") {
                expect(personnel.nurse).toBe(2);
                expect(personnel.physician).toBe(1);
            }

            if (patient.priority === "urgent" || patient.priority === "less_urgent" || patient.priority === "non_urgent") {
                expect(personnel.nurse).toBe(1);
                expect(personnel.physician).toBe(1);
            }

            if (patient.priority !== "resuscitation") {
                const usesEdBed = resources.ed_bed === 1;
                const usesIsolation = resources.isolation_room === 1;
                expect(Number(usesEdBed) + Number(usesIsolation)).toBe(1);
            }
        }
    });

    it("returns the requested number of patients with unique ids and non-decreasing arrival times", () => {
        const generator = new PatientGenerator(new SeededRandom(7), NormalProfile);
        const patients = generator.generatePatients(50);

        expect(patients).toHaveLength(50);
        expect(patients.map((patient) => patient.id)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));

        for (let i = 1; i < patients.length; i++) {
            const current = patients[i];
            const previous = patients[i - 1];

            expect(current).toBeDefined();
            expect(previous).toBeDefined();
            expect(current!.arrivalTime).toBeGreaterThanOrEqual(previous!.arrivalTime);
        }
    });

    it("keeps treatment times in the 0.5x-1.5x range and near each triage mean", () => {
        const generator = new PatientGenerator(new SeededRandom(11), NormalProfile);
        const patients = generator.generatePatients(10000);

        const buckets = {
            non_urgent: [] as number[],
            less_urgent: [] as number[],
            urgent: [] as number[],
            emergent: [] as number[],
            resuscitation: [] as number[]
        };

        for (const patient of patients) {
            const mean = TRIAGE_TREATMENT_MEAN_MINUTES[patient.priority];
            expect(patient.estimatedTreatmentTime).toBeGreaterThanOrEqual(mean * 0.5);
            expect(patient.estimatedTreatmentTime).toBeLessThanOrEqual(mean * 1.5);
            buckets[patient.priority].push(patient.estimatedTreatmentTime);
        }

        for (const priority of Object.keys(buckets) as Array<keyof typeof buckets>) {
            const values = buckets[priority];
            const mean = TRIAGE_TREATMENT_MEAN_MINUTES[priority];
            const average = values.reduce((sum, value) => sum + value, 0) / values.length;

            // A uniform draw over [0.5 x mean, 1.5 x mean] has a standard deviation of mean / sqrt(12).
            // The average of n draws varies by about that divided by sqrt(n) (the standard error),
            // so rare levels like resuscitation get a wider tolerance than common ones like urgent.
            const standardError = (mean / Math.sqrt(12)) / Math.sqrt(values.length);

            expect(Math.abs(average - mean)).toBeLessThanOrEqual(3 * standardError);
        }
    });

    it("keeps normal priority shares close to NHAMCS probabilities", () => {
        const generator = new PatientGenerator(new SeededRandom(99), NormalProfile);
        const sampleSize = 10000;
        const patients = generator.generatePatients(sampleSize);

        const counts = {
            non_urgent: 0,
            less_urgent: 0,
            urgent: 0,
            emergent: 0,
            resuscitation: 0
        };

        for (const patient of patients) {
            counts[patient.priority] += 1;
        }

        const tolerance = 0.02;

        for (const [priority, probability] of Object.entries(NormalProfile.priority_distribution) as [keyof typeof counts, number][]) {
            const observedShare = counts[priority] / sampleSize;

            expect(Math.abs(observedShare - probability)).toBeLessThanOrEqual(tolerance);
        }
    });

    it("uses the same seed to produce the same mass-casualty patient list", () => {
        const generator1 = new PatientGenerator(new SeededRandom(42), MassCasualtyProfile);
        const generator2 = new PatientGenerator(new SeededRandom(42), MassCasualtyProfile);

        const patients1 = generator1.generatePatients(200);
        const patients2 = generator2.generatePatients(200);

        expect(patients1).toEqual(patients2);
    });

    it("uses a much higher arrival rate during surge hours 2-8 than after hour 8", () => {
        const generator = new PatientGenerator(new SeededRandom(123), MassCasualtyProfile);
        const patients = generator.generatePatients(4000);

        const surgeWindowStart = 2 * 60;
        const surgeWindowEnd = 8 * 60;
        const postSurgeWindowEnd = 14 * 60;

        const surgeCount = patients.filter(
            (patient) => patient.arrivalTime >= surgeWindowStart && patient.arrivalTime < surgeWindowEnd
        ).length;

        const postSurgeCount = patients.filter(
            (patient) => patient.arrivalTime >= surgeWindowEnd && patient.arrivalTime < postSurgeWindowEnd
        ).length;

        const surgeRate = surgeCount / 6;
        const postSurgeRate = postSurgeCount / 6;

        expect(surgeRate).toBeGreaterThan(postSurgeRate * 2.5);
    });
});