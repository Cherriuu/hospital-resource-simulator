import type { ResourceSnapshot } from "../models/resources";
import type { Patient } from "../models/patient";

// total and available start off the same initially.
export const InitialResourceSnapshot: ResourceSnapshot = {
    total: {
        resources: {
            general_ward_bed: 100,
            icu_bed: 20,
            operating_room: 5,
            isolation_room: 10,
            imaging_room: 15
        },
        personnel: {
            physician: 30,
            nurse: 50,
            surgeon: 10,
            anesthesiologist: 5
        }
    },
    available: {
        resources: {
            general_ward_bed: 100,
            icu_bed: 20,
            operating_room: 5,
            isolation_room: 10,
            imaging_room: 15
        },
        personnel: {
            physician: 30,
            nurse: 50,
            surgeon: 10,
            anesthesiologist: 5
        }
    }
}

export class ResourceManager {
    private resourceSnapshot: ResourceSnapshot;

    constructor(resourceSnapshot: ResourceSnapshot) {
        this.resourceSnapshot = resourceSnapshot;
    }

    // if patient can be allocated resources but not personnel, then the patient will wait until personnel is available. If resources are not available, we will decide what to do with the patient.
    // resources cannot be held up for the patient to wait for personnel to be available. 
    public canAllocateResources(patient: Patient): boolean {
    const needed = patient.resourcesNeeded;
    const available = this.resourceSnapshot.available;

    for (const [resource, quantity] of Object.entries(needed.resources)) {
        const resourceType = resource as keyof typeof available.resources;

        if (available.resources[resourceType] < quantity) {
            return false;
        }
    }

    for (const [personnel, quantity] of Object.entries(needed.personnel)) {
        const personnelType = personnel as keyof typeof available.personnel;

        if (available.personnel[personnelType] < quantity) {
            return false;
        }
    }

    return true;
    }

    // functions for adjusting the available resources and personnel when a patient is allocated or released from the hospital.
    public allocateResources(patient: Patient): void {
        if (!this.canAllocateResources(patient)) {
            return;
        }

        const needed = patient.resourcesNeeded;
        const available = this.resourceSnapshot.available;

        for (const [resource, quantity] of Object.entries(needed.resources)) {
            const resourceType = resource as keyof typeof available.resources;

            available.resources[resourceType] -= quantity;
        }

        for (const [personnel, quantity] of Object.entries(needed.personnel)) {
            const personnelType = personnel as keyof typeof available.personnel;

            available.personnel[personnelType] -= quantity;
        }
    }

    public releaseResources(patient: Patient): void {
        const needed = patient.resourcesNeeded;
        const available = this.resourceSnapshot.available;
        const total = this.resourceSnapshot.total;

        for (const [resource, quantity] of Object.entries(needed.resources)) {
            const resourceType = resource as keyof typeof available.resources;

            available.resources[resourceType] = Math.min(
                available.resources[resourceType] + quantity,
                total.resources[resourceType]
            );
        }

        for (const [personnel, quantity] of Object.entries(needed.personnel)) {
            const personnelType = personnel as keyof typeof available.personnel;

            available.personnel[personnelType] = Math.min(
                available.personnel[personnelType] + quantity,
                total.personnel[personnelType]
            );
        }
    }

    public getResourceSnapshot(): ResourceSnapshot {
        return this.resourceSnapshot;
    }
}