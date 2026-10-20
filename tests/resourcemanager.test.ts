import { describe, expect, it } from "vitest";
import { InitialResourceSnapshot, ResourceManager } from "../src/resources/resourcemanager";
import type { Patient } from "../src/models/Patient";

function makeUrgentPatient(id: number): Patient {
    return {
        id,
        name: `Patient-${id}`,
        age: 35,
        arrivalTime: id,
        estimatedTreatmentTime: 30,
        priority: "urgent",
        resourcesNeeded: {
            resources: { ed_bed: 1 },
            personnel: { nurse: 1, physician: 1 }
        }
    };
}

describe("ResourceManager", () => {
    it("allocates and releases exact ED resources and slot-based personnel", () => {
        const manager = new ResourceManager(structuredClone(InitialResourceSnapshot));
        const patient = makeUrgentPatient(1);

        const before = structuredClone(manager.getResourceSnapshot().available);
        manager.allocateResources(patient);

        const during = manager.getResourceSnapshot().available;
        expect(during.resources.ed_bed).toBe(before.resources.ed_bed - 1);
        expect(during.personnel.nurse).toBe(before.personnel.nurse - 1);
        expect(during.personnel.physician).toBe(before.personnel.physician - 1);

        manager.releaseResources(patient);

        expect(manager.getResourceSnapshot().available).toEqual(before);
    });

    it("converts staffing input to slots (1 nurse -> 4 slots, 1 physician -> 8 slots)", () => {
        const manager = new ResourceManager({
            total: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 1 }
            },
            available: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 1 }
            }
        });

        const snapshot = manager.getResourceSnapshot();
        expect(snapshot.total.personnel.nurse).toBe(4);
        expect(snapshot.total.personnel.physician).toBe(8);
    });

    it("1 nurse can hold four urgent patients but only one resuscitation patient", () => {
        const manager = new ResourceManager({
            total: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 10 }
            },
            available: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 10 }
            }
        });

        const urgentPatients: Patient[] = [1, 2, 3, 4].map((id) => makeUrgentPatient(id));

        for (const patient of urgentPatients) {
            expect(manager.canAllocateResources(patient)).toBe(true);
            manager.allocateResources(patient);
        }

        expect(manager.canAllocateResources(makeUrgentPatient(99))).toBe(false);

        const resusPatient: Patient = {
            id: 200,
            name: "Patient-200",
            age: 55,
            arrivalTime: 0,
            estimatedTreatmentTime: 45,
            priority: "resuscitation",
            resourcesNeeded: {
                resources: { resus_bay: 1 },
                personnel: { nurse: 4, physician: 1 }
            }
        };

        const resusOnlyManager = new ResourceManager({
            total: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 10 }
            },
            available: {
                resources: { ed_bed: 10, resus_bay: 2, isolation_room: 2 },
                personnel: { nurse: 1, physician: 10 }
            }
        });

        expect(resusOnlyManager.canAllocateResources(resusPatient)).toBe(true);
        resusOnlyManager.allocateResources(resusPatient);
        expect(resusOnlyManager.canAllocateResources(resusPatient)).toBe(false);
    });
});
