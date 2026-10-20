import { describe, expect, it } from "vitest";
import { FCFSScheduler } from "../src/scheduling/FCFSScheduler";
import { PriorityScheduler } from "../src/scheduling/PriorityScheduler";
import { EventQueue, ArrayEventQueue } from "../src/simulation/EventQueue";
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

describe("EventQueue", () => {
    it("pops events in time order with random values", () => {
        const queue = new EventQueue();
        const expected: number[] = [];

        for (let i = 0; i < 1000; i++) {
            const time = Math.floor(Math.random() * 1000);
            queue.push({ type: "PatientArrival", time, sequence: i, patientid: i });
            expected.push(time);
        }

        const popped = [] as number[];
        while (!queue.isEmpty()) {
            const event = queue.pop();
            expect(event).toBeDefined();
            popped.push(event!.time);
        }

        expect(popped).toEqual([...expected].sort((a, b) => a - b));
    });

    it("uses sequence order when times are equal and empty pop returns undefined", () => {
        const queue = new EventQueue();
        queue.push({ type: "PatientArrival", time: 5, sequence: 2, patientid: 2 });
        queue.push({ type: "PatientArrival", time: 5, sequence: 1, patientid: 1 });
        queue.push({ type: "TreatmentComplete", time: 5, sequence: 0, patientid: 0 });

        expect(queue.pop()?.sequence).toBe(0);
        expect(queue.pop()?.sequence).toBe(1);
        expect(queue.pop()?.sequence).toBe(2);
        expect(queue.pop()).toBeUndefined();
    });

    it("produces the same simulation results with the heap and array queue for the same seed", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 2;
        snapshot.available.personnel.physician = 2;
        snapshot.available.personnel.nurse = 2;

        const patients = Array.from({ length: 30 }, (_, index) => ({
            id: index + 1,
            name: `Patient-${index + 1}`,
            age: 40,
            arrivalTime: index % 7,
            estimatedTreatmentTime: 4 + (index % 5),
            priority: ["non_urgent", "less_urgent", "urgent", "emergent", "resuscitation"][index % 5] as Patient["priority"],
            resourcesNeeded: {
                resources: { icu_bed: 1 },
                personnel: { physician: 1, nurse: 1 }
            }
        }));

        const heapEngine = new SimulationEngine(new ResourceManager(snapshot), patients, new PriorityScheduler(), { queueType: "heap" });
        const arrayEngine = new SimulationEngine(new ResourceManager(structuredClone(snapshot)), patients, new PriorityScheduler(), { queueType: "array" });

        heapEngine.RunSimulation();
        arrayEngine.RunSimulation();

        expect(heapEngine.getSimulationResults()).toEqual(arrayEngine.getSimulationResults());
    });
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

    it("counts untreated patients when ICU capacity is zero", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 0;
        snapshot.available.personnel.physician = 20;
        snapshot.available.personnel.nurse = 20;

        const patients = [
            makePatient(1, 0, "non_urgent", 5),
            makePatient(2, 1, "resuscitation", 5),
            { ...makePatient(3, 2, "urgent", 5), resourcesNeeded: { resources: {}, personnel: { nurse: 1 } } },
            { ...makePatient(4, 3, "less_urgent", 5), resourcesNeeded: { resources: { icu_bed: 1 }, personnel: { physician: 1, nurse: 1 } } },
            { ...makePatient(5, 4, "emergent", 5), resourcesNeeded: { resources: { icu_bed: 1 }, personnel: { physician: 1, nurse: 1 } } }
        ];

        const engine = new SimulationEngine(new ResourceManager(snapshot), patients, new PriorityScheduler());

        engine.RunSimulation();

        const untreated = patients.filter(
            patient => patient.resourcesNeeded.resources.icu_bed === 1
        ).length;

        expect(engine.getUntreatedPatientsCount()).toBe(untreated);
    });

    it("returns zero untreated patients when capacity is normal", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);

        const patients = [
            makePatient(1, 0, "non_urgent", 5),
            makePatient(2, 0.5, "urgent", 5),
            makePatient(3, 1, "less_urgent", 5)
        ];

        const engine = new SimulationEngine(new ResourceManager(snapshot), patients, new PriorityScheduler());

        engine.RunSimulation();

        expect(engine.getUntreatedPatientsCount()).toBe(0);
    });
});
