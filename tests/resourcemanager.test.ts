import { describe, expect, it } from "vitest";
import { InitialResourceSnapshot, ResourceManager } from "../src/resources/resourcemanager";
import type { Patient } from "../src/models/patient";

describe("ResourceManager", () => {
    it("allocates a patient whose needs fit and reduces available counts by the exact amount required", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        const manager = new ResourceManager(snapshot);

        const patient: Patient = {
            id: 1,
            name: "Patient-1",
            age: 45,
            arrivalTime: 0,
            estimatedTreatmentTime: 120,
            priority: "urgent",
            resourcesNeeded: {
                resources: {
                    icu_bed: 2,
                    imaging_room: 1
                },
                personnel: {
                    physician: 1,
                    nurse: 2
                }
            }
        };

        const before = structuredClone(snapshot.available);

        expect(manager.canAllocateResources(patient)).toBe(true);

        manager.allocateResources(patient);

        const after = manager.getResourceSnapshot().available;

        expect(after.resources.icu_bed).toBe(before.resources.icu_bed - 2);
        expect(after.resources.imaging_room).toBe(before.resources.imaging_room - 1);
        expect(after.personnel.physician).toBe(before.personnel.physician - 1);
        expect(after.personnel.nurse).toBe(before.personnel.nurse - 2);
    });

    it("does nothing at all when any resource or staff role is short", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        const manager = new ResourceManager(snapshot);

        const patient: Patient = {
            id: 2,
            name: "Patient-2",
            age: 60,
            arrivalTime: 1,
            estimatedTreatmentTime: 90,
            priority: "emergent",
            resourcesNeeded: {
                resources: {
                    icu_bed: 21
                },
                personnel: {
                    physician: 31
                }
            }
        };

        const before = structuredClone(snapshot);

        expect(manager.canAllocateResources(patient)).toBe(false);

        manager.allocateResources(patient);

        expect(manager.getResourceSnapshot()).toEqual(before);
    });

    it("releases exactly what was taken and never goes above the total", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        const manager = new ResourceManager(snapshot);

        const patient: Patient = {
            id: 3,
            name: "Patient-3",
            age: 33,
            arrivalTime: 2,
            estimatedTreatmentTime: 60,
            priority: "less_urgent",
            resourcesNeeded: {
                resources: {
                    general_ward_bed: 1,
                    imaging_room: 1
                },
                personnel: {
                    nurse: 1
                }
            }
        };

        const before = structuredClone(snapshot.available);

        manager.allocateResources(patient);
        manager.releaseResources(patient);

        const after = manager.getResourceSnapshot().available;

        expect(after).toEqual(before);

        for (const [resource, total] of Object.entries(snapshot.total.resources) as [keyof typeof snapshot.total.resources, number][]) {
            expect(after.resources[resource]).toBeLessThanOrEqual(total);
        }

        for (const [personnel, total] of Object.entries(snapshot.total.personnel) as [keyof typeof snapshot.total.personnel, number][]) {
            expect(after.personnel[personnel]).toBeLessThanOrEqual(total);
        }
    });

    it("allows only the first patient to keep the last ICU bed until it is released", () => {
        const snapshot = structuredClone(InitialResourceSnapshot);
        snapshot.available.resources.icu_bed = 1;
        snapshot.available.personnel.physician = 1;
        snapshot.available.personnel.nurse = 1;

        const manager = new ResourceManager(snapshot);

        const firstPatient: Patient = {
            id: 10,
            name: "Patient-10",
            age: 50,
            arrivalTime: 0,
            estimatedTreatmentTime: 30,
            priority: "urgent",
            resourcesNeeded: {
                resources: {
                    icu_bed: 1
                },
                personnel: {
                    physician: 1,
                    nurse: 1
                }
            }
        };

        const secondPatient: Patient = {
            id: 11,
            name: "Patient-11",
            age: 55,
            arrivalTime: 5,
            estimatedTreatmentTime: 30,
            priority: "resuscitation",
            resourcesNeeded: {
                resources: {
                    icu_bed: 1
                },
                personnel: {
                    physician: 1,
                    nurse: 1
                }
            }
        };

        expect(manager.canAllocateResources(firstPatient)).toBe(true);
        manager.allocateResources(firstPatient);

        expect(manager.canAllocateResources(secondPatient)).toBe(false);

        manager.releaseResources(firstPatient);

        expect(manager.canAllocateResources(secondPatient)).toBe(true);
    });
});
