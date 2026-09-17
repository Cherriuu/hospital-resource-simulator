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
        const neededResources = patient.resourcesNeeded;
        const availableResources = this.resourceSnapshot.available;

        if (availableResources.resources[neededResources.resources] < 1) {
            return false;
        }

        if (availableResources.personnel[neededResources.personnel] < neededResources.personnelQuantity) {
            return false;
        }

        return true;
    }

    // functions for adjusting the available resources and personnel when a patient is allocated or released from the hospital.
    public allocateResources(patient: Patient): void {
        if (this.canAllocateResources(patient)) {
            const neededResources = patient.resourcesNeeded;
            this.resourceSnapshot.available.resources[neededResources.resources] -= 1;
            this.resourceSnapshot.available.personnel[neededResources.personnel] -= neededResources.personnelQuantity;
        }
    }

    // come back later to add a check to ensure that the resources being released are not exceeding the total capacity of the hospital.
    public releaseResources(patient: Patient): void {
        const neededResources = patient.resourcesNeeded;
        this.resourceSnapshot.available.resources[neededResources.resources] += 1;
        this.resourceSnapshot.available.personnel[neededResources.personnel] += neededResources.personnelQuantity;
    }

    public getResourceSnapshot(): ResourceSnapshot {
        return this.resourceSnapshot;
    }
}