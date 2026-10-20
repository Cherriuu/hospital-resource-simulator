import { describe, expect, it } from "vitest";
import { NormalProfile } from "../src/config/Workloadprofiles";
import { PatientGenerator } from "../src/generators/patientgenerator";
import { SeededRandom } from "../src/random/seededrandom";

describe("PatientGenerator", () => {
    it("uses the same seed to produce the same patient list", () => {
        const generator1 = new PatientGenerator(new SeededRandom(42), NormalProfile);
        const generator2 = new PatientGenerator(new SeededRandom(42), NormalProfile);

        const patients1 = generator1.generatePatients(30);
        const patients2 = generator2.generatePatients(30);

        expect(patients1).toEqual(patients2);
    });

    it("adds surgeon and anesthesiologist whenever a patient needs an operating room", () => {
        const generator = new PatientGenerator(new SeededRandom(77), NormalProfile);
        const patients = generator.generatePatients(500);

        for (const patient of patients) {
            const hasOperatingRoom = patient.resourcesNeeded.resources.operating_room === 1;

            if (hasOperatingRoom) {
                expect(patient.resourcesNeeded.personnel.surgeon).toBe(1);
                expect(patient.resourcesNeeded.personnel.anesthesiologist).toBe(1);
            } else {
                expect(patient.resourcesNeeded.personnel.surgeon).toBeUndefined();
                expect(patient.resourcesNeeded.personnel.anesthesiologist).toBeUndefined();
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

    it("keeps treatment times inside the profile range for each priority", () => {
        const generator = new PatientGenerator(new SeededRandom(11), NormalProfile);
        const patients = generator.generatePatients(500);

        const ranges = {
            non_urgent: NormalProfile.treatment_range.non_urgent_range,
            less_urgent: NormalProfile.treatment_range.less_urgent_range,
            urgent: NormalProfile.treatment_range.urgent_range,
            emergent: NormalProfile.treatment_range.emergent_range,
            resuscitation: NormalProfile.treatment_range.resuscitation_range
        };

        for (const patient of patients) {
            const range = ranges[patient.priority];
            expect(patient.estimatedTreatmentTime).toBeGreaterThanOrEqual(range.min);
            expect(patient.estimatedTreatmentTime).toBeLessThanOrEqual(range.max);
        }
    });

    it("keeps the observed priority share close to the configured profile probabilities", () => {
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
});
