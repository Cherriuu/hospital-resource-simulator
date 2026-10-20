import type { Patient, PersonnelType, ResourceType } from "../models/Patient.js";
import type { HospitalCapacity } from "../models/Resources.js";

export type LoadCheckedType = ResourceType | PersonnelType;

export interface OverloadedResource {
    readonly type: LoadCheckedType;
    readonly loadPercent: number;
}

export interface LoadCheckResult {
    readonly arrivalSpanHours: number;
    readonly overloadedResources: OverloadedResource[];
}

const ZERO_CAPACITY_OVERLOAD_PERCENT = 9999;

const RESOURCE_TYPES: ResourceType[] = [
    "general_ward_bed",
    "icu_bed",
    "operating_room",
    "isolation_room",
    "imaging_room"
];

const PERSONNEL_TYPES: PersonnelType[] = [
    "physician",
    "nurse",
    "surgeon",
    "anesthesiologist"
];

const ALL_TYPES: LoadCheckedType[] = [...RESOURCE_TYPES, ...PERSONNEL_TYPES];

function roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
}

export function checkWorkloadLoad(patients: Patient[], capacity: HospitalCapacity): LoadCheckResult {
    const demandByType = Object.fromEntries(ALL_TYPES.map((type) => [type, 0])) as Record<LoadCheckedType, number>;

    for (const patient of patients) {
        const treatmentMinutes = patient.estimatedTreatmentTime;

        for (const [resource, quantity] of Object.entries(patient.resourcesNeeded.resources)) {
            const resourceType = resource as ResourceType;
            demandByType[resourceType] += quantity * treatmentMinutes;
        }

        for (const [personnel, quantity] of Object.entries(patient.resourcesNeeded.personnel)) {
            const personnelType = personnel as PersonnelType;
            demandByType[personnelType] += quantity * treatmentMinutes;
        }
    }

    const lastArrivalTimeMinutes = patients.length > 0 ? patients[patients.length - 1].arrivalTime : 0;
    const arrivalSpanMinutes = Math.max(lastArrivalTimeMinutes, 1);
    const overloadedResources: OverloadedResource[] = [];

    for (const type of ALL_TYPES) {
        const demandedMinutes = demandByType[type];

        if (demandedMinutes <= 0) {
            continue;
        }

        const capacityValue = type in capacity.resources
            ? capacity.resources[type as ResourceType]
            : capacity.personnel[type as PersonnelType];

        if (capacityValue === 0) {
            overloadedResources.push({
                type,
                loadPercent: ZERO_CAPACITY_OVERLOAD_PERCENT
            });
            continue;
        }

        const loadPercent = (demandedMinutes / (capacityValue * arrivalSpanMinutes)) * 100;

        if (loadPercent > 100) {
            overloadedResources.push({
                type,
                loadPercent: roundToOneDecimal(loadPercent)
            });
        }
    }

    overloadedResources.sort((left, right) => right.loadPercent - left.loadPercent);

    return {
        arrivalSpanHours: roundToOneDecimal(lastArrivalTimeMinutes / 60),
        overloadedResources
    };
}
