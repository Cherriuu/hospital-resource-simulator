export type PatientPriority = 'non_urgent' | 'less_urgent' | 'urgent' | 'emergent' | 'resuscitation';

export type ResourceType = 'general_ward_bed' | 'icu_bed' | 'operating_room' | 'isolation_room' | 'imaging_room';

export type PersonnelType = 'physician' | 'nurse' | 'surgeon' | 'anesthesiologist';

export interface PatientResourcesNeeded {
    readonly resources: Partial<Record<ResourceType, number>>;
    readonly personnel: Partial<Record<PersonnelType, number>>;
}

export interface Patient {
    readonly id: number;
    readonly name: string;
    readonly age: number;
    readonly arrivalTime: number;
    readonly estimatedTreatmentTime: number;
    readonly priority: PatientPriority;
    readonly resourcesNeeded: PatientResourcesNeeded;
}