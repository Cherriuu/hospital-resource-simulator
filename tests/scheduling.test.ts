import { describe, expect, it } from "vitest";
import type { Patient } from "../src/models/Patient";
import type { ResourceSnapshot } from "../src/models/Resources";
import { ResourceManager } from "../src/resources/resourcemanager";
import { FCFSScheduler } from "../src/scheduling/FCFSScheduler";
import { PriorityScheduler } from "../src/scheduling/PriorityScheduler";
import { PriorityandAgingScheduler, effectivePriority } from "../src/scheduling/Priority+Aging";
import { SimulationEngine } from "../src/simulation/SimulationEngine";

// A patient who needs an ED bed, one physician slot and the given number of nurse slots
function makePatient(
    id: number,
    arrivalTime: number,
    priority: Patient["priority"],
    treatmentTime: number,
    nurseSlots = 1
): Patient {
    return {
        id,
        name: `Patient-${id}`,
        age: 40,
        arrivalTime,
        estimatedTreatmentTime: treatmentTime,
        priority,
        resourcesNeeded: {
            resources: { ed_bed: 1 },
            personnel: { physician: 1, nurse: nurseSlots }
        }
    };
}

// Plenty of beds and physicians, but exactly 1 nurse (4 nurse slots), so nurses are the only bottleneck
function oneNurseHospital(): ResourceSnapshot {
    const capacity = {
        resources: { ed_bed: 20, resus_bay: 4, isolation_room: 4 },
        personnel: { physician: 10, nurse: 1 }
    };

    return {
        total: structuredClone(capacity),
        available: structuredClone(capacity)
    };
}

function startTimes(engine: SimulationEngine): Map<number, number> {
    return new Map(engine.getSimulationResults().map((result) => [result.patientId, result.treatmentStartTime]));
}

describe("Capped priority aging", () => {
    it("never lets a long-waiting patient outrank a resuscitation patient", () => {
        const waitedTenHours = makePatient(1, 0, "non_urgent", 60);
        const justArrived = makePatient(2, 600, "resuscitation", 60);

        const ordered = new PriorityandAgingScheduler().orderPatients([waitedTenHours, justArrived], 600);

        expect(ordered[0]?.id).toBe(2);
    });

    it("never lets a long-waiting patient outrank an emergent patient", () => {
        const waitedTenHours = makePatient(1, 0, "less_urgent", 60);
        const justArrived = makePatient(2, 600, "emergent", 60);

        const ordered = new PriorityandAgingScheduler().orderPatients([waitedTenHours, justArrived], 600);

        expect(ordered[0]?.id).toBe(2);
    });

    it("caps aging at the urgent level", () => {
        const waitedTenHours = makePatient(1, 0, "non_urgent", 60);

        // non_urgent is level 1; two levels of aging reach urgent (level 3) and stop there
        expect(effectivePriority(waitedTenHours, 600)).toBe(3);
    });

    it("lets a long-waiting lower-acuity patient go ahead of a newly arrived urgent patient", () => {
        const waitedThreeHours = makePatient(1, 0, "less_urgent", 60);
        const justArrived = makePatient(2, 180, "urgent", 60);

        // Both are at the urgent level now, so whoever has waited longest goes first
        const ordered = new PriorityandAgingScheduler().orderPatients([justArrived, waitedThreeHours], 180);

        expect(ordered[0]?.id).toBe(1);
    });
});

describe("Holding resources for waiting patients", () => {
    it("doesn't let 1-slot patients keep taking the nurse slot an emergent patient is waiting for", () => {
        const patients = [
            // Four urgent patients use all 4 nurse slots; the first finishes at minute 10
            makePatient(1, 0, "urgent", 10),
            makePatient(2, 0, "urgent", 100),
            makePatient(3, 0, "urgent", 100),
            makePatient(4, 0, "urgent", 100),
            // The emergent patient needs 2 nurse slots, so 1 free slot isn't enough
            makePatient(5, 1, "emergent", 50, 2),
            // This urgent patient only needs 1 slot and could take the slot freed at minute 10
            makePatient(6, 2, "urgent", 50)
        ];

        const engine = new SimulationEngine(new ResourceManager(oneNurseHospital()), patients, new PriorityScheduler());
        engine.RunSimulation();

        const starts = startTimes(engine);

        // The slot freed at minute 10 is held for the emergent patient instead of going to patient 6.
        // At minute 100 three patients finish at once, so the emergent patient starts then (with patient 6 right after).
        expect(starts.get(6) ?? Number.POSITIVE_INFINITY).toBeGreaterThan(10);
        expect(starts.get(5)).toBe(100);
        expect(starts.get(6) ?? Number.POSITIVE_INFINITY).toBeGreaterThanOrEqual(starts.get(5) ?? 0);
    });

    it("doesn't let a new arrival skip ahead of someone already waiting (FCFS)", () => {
        const patients = [
            makePatient(1, 0, "urgent", 100),
            makePatient(2, 0, "urgent", 100),
            makePatient(3, 0, "urgent", 100),
            // Waiting for 2 slots while only 1 is free
            makePatient(4, 1, "non_urgent", 50, 2),
            // Arrives later and only needs the 1 free slot
            makePatient(5, 2, "non_urgent", 50)
        ];

        const engine = new SimulationEngine(new ResourceManager(oneNurseHospital()), patients, new FCFSScheduler());
        engine.RunSimulation();

        const starts = startTimes(engine);

        expect(starts.get(5) ?? Number.POSITIVE_INFINITY).toBeGreaterThanOrEqual(starts.get(4) ?? 0);
    });

    it("still lets a patient start right away if they don't need anything that's being held", () => {
        const patients = [
            makePatient(1, 0, "urgent", 100),
            makePatient(2, 0, "urgent", 100),
            makePatient(3, 0, "urgent", 100),
            // Waiting for 2 nurse slots, so nurses are held for this patient
            makePatient(4, 1, "emergent", 50, 2),
            // Needs a physician and an isolation room but no nurse, so nothing held blocks them
            {
                ...makePatient(5, 2, "non_urgent", 50),
                resourcesNeeded: {
                    resources: { isolation_room: 1 },
                    personnel: { physician: 1 }
                }
            }
        ];

        const engine = new SimulationEngine(new ResourceManager(oneNurseHospital()), patients, new PriorityScheduler());
        engine.RunSimulation();

        expect(startTimes(engine).get(5)).toBe(2);
    });

    it("doesn't hold resources for a patient who could never be treated here", () => {
        const patients = [
            // Needs 8 nurse slots, but this hospital only has 4, so they can never start
            makePatient(1, 0, "emergent", 50, 8),
            // Should still be treated right away instead of waiting behind patient 1 forever
            makePatient(2, 1, "urgent", 50)
        ];

        const engine = new SimulationEngine(new ResourceManager(oneNurseHospital()), patients, new PriorityScheduler());
        engine.RunSimulation();

        expect(startTimes(engine).get(2)).toBe(1);
        expect(engine.getUntreatedPatientsCount()).toBe(1);
    });
});
