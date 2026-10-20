import { describe, expect, it } from "vitest";
import { FCFSScheduler } from "../src/scheduling/FCFSScheduler";
import { PriorityScheduler } from "../src/scheduling/PriorityScheduler";
import { SimulationEngine } from "../src/simulation/SimulationEngine";
import { InitialResourceSnapshot, ResourceManager } from "../src/resources/resourcemanager";
import type { Patient } from "../src/models/patient";

const makePatient = (
    id: number,
    arrivalTime: number,
    priority: Patient["priority"],
    treatmentTime: number
): Patient => ({
    id,
    name: `Patient-${id}`,
    age: 40,
    arrivalTime,
    estimatedTreatmentTime: treatmentTime,
    priority,
    resourcesNeeded: {
        resources: {
            icu_bed: 1
        },
        personnel: {
            physician: 1,
            nurse: 1
        }
    }
});

describe("SimulationEngine", () => {
    it("lets the higher-priority waiting patient start first when a bed is released", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 1;
        snapshot.available.personnel.physician = 1;
        snapshot.available.personnel.nurse = 1;

        const patients = [
            makePatient(1, 0, "non_urgent", 5),
            makePatient(2, 1, "resuscitation", 5),
            makePatient(3, 0.5, "less_urgent", 5)
        ];

        const engine = new SimulationEngine(new ResourceManager(snapshot), patients, new PriorityScheduler());

        engine.RunSimulation();

        const results = engine.getSimulationResults();
        const byId = new Map(results.map((result) => [result.patientId, result]));

        expect(byId.get(2)?.treatmentStartTime).toBeLessThan(byId.get(3)?.treatmentStartTime ?? Number.POSITIVE_INFINITY);
    });

    it("uses arrival order when the scheduler is FIFO", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 1;
        snapshot.available.personnel.physician = 1;
        snapshot.available.personnel.nurse = 1;

        const patients = [
            makePatient(1, 0, "non_urgent", 5),
            makePatient(2, 1, "resuscitation", 5),
            makePatient(3, 0.5, "less_urgent", 5)
        ];

        const engine = new SimulationEngine(new ResourceManager(snapshot), patients, new FCFSScheduler());

        engine.RunSimulation();

        const results = engine.getSimulationResults();
        const byId = new Map(results.map((result) => [result.patientId, result]));

        expect(byId.get(3)?.treatmentStartTime).toBeLessThan(byId.get(2)?.treatmentStartTime ?? Number.POSITIVE_INFINITY);
    });

    it("completes every patient and never records negative wait time", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 1;
        snapshot.available.personnel.physician = 1;
        snapshot.available.personnel.nurse = 1;

        const patients = [
            makePatient(1, 0, "urgent", 10),
            makePatient(2, 2, "less_urgent", 5),
            makePatient(3, 4, "non_urgent", 5)
        ];

        const engine = new SimulationEngine(new ResourceManager(snapshot), patients, new PriorityScheduler());

        engine.RunSimulation();

        const results = engine.getSimulationResults();

        expect(results).toHaveLength(3);

        for (const result of results) {
            expect(result.waitingTime).toBeGreaterThanOrEqual(0);
            expect(result.treatmentStartTime).toBeLessThanOrEqual(result.treatmentEndTime);
            expect(result.treatmentDuration).toBeGreaterThan(0);
        }
    });
});
