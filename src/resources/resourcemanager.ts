import type { ResourceSnapshot } from "../models/Resources.js";
import type { Patient } from "../models/Patient.js";
import { STAFF_SLOT_CAPACITY } from "../constants/edModel.js";

// total and available start off the same initially.
export const InitialResourceSnapshot: ResourceSnapshot = {
    total: {
        resources: {
            ed_bed: 48,
            resus_bay: 4,
            isolation_room: 6
        },
        personnel: {
            physician: 6,
            nurse: 15
        }
    },
    available: {
        resources: {
            ed_bed: 48,
            resus_bay: 4,
            isolation_room: 6
        },
        personnel: {
            physician: 6,
            nurse: 15
        }
    }
}

export class ResourceManager {
    private resourceSnapshot: ResourceSnapshot;

    constructor(resourceSnapshot: ResourceSnapshot) {
        this.resourceSnapshot = {
            total: {
                resources: { ...resourceSnapshot.total.resources },
                personnel: {
                    nurse: resourceSnapshot.total.personnel.nurse * STAFF_SLOT_CAPACITY.nurse,
                    physician: resourceSnapshot.total.personnel.physician * STAFF_SLOT_CAPACITY.physician
                }
            },
            available: {
                resources: { ...resourceSnapshot.available.resources },
                personnel: {
                    nurse: resourceSnapshot.available.personnel.nurse * STAFF_SLOT_CAPACITY.nurse,
                    physician: resourceSnapshot.available.personnel.physician * STAFF_SLOT_CAPACITY.physician
                }
            }
        };
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

    public findMissingResource(patient: Patient): keyof typeof this.resourceSnapshot.available.resources | keyof typeof this.resourceSnapshot.available.personnel | null {
        const available = this.resourceSnapshot.available;

        for (const [resource, quantity] of Object.entries(patient.resourcesNeeded.resources)) {
            const resourceType = resource as keyof typeof available.resources;

            if (available.resources[resourceType] < quantity) {
                return resourceType;
            }
        }

        for (const [personnel, quantity] of Object.entries(patient.resourcesNeeded.personnel)) {
            const personnelType = personnel as keyof typeof available.personnel;

            if (available.personnel[personnelType] < quantity) {
                return personnelType;
            }
        }

        return null;
    }

    public getResourceSnapshot(): ResourceSnapshot {
        return this.resourceSnapshot;
    }
}