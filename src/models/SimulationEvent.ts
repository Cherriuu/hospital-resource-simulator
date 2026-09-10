import type {ResourceType, PersonnelType} from "./patient";

export type SimulationEvent = 'PatientArrival' | 'TreatmentComplete' | 'ResourceFailure' | 'ResourceRestore' | 'PersonnelFailure' | 'PersonnelRestore';

export interface PatientArrival {
    readonly type: "PatientArrival";
    readonly time: number;
    readonly sequence: number;
    readonly patientid: number;
}

export interface TreatmentComplete {
    readonly type: "TreatmentComplete";
    readonly time: number;
    readonly sequence: number;
    readonly patientid: number;
}

export interface ResourceFailure {
    readonly type: "ResourceFailure";
    readonly time: number;
    readonly sequence: number;
    readonly resourcetype: ResourceType;
    readonly quantity: number;
}

export interface ResourceRestore {
    readonly type: "ResourceRestore";
    readonly time: number;
    readonly sequence: number;
    readonly resourcetype: ResourceType;
    readonly quantity: number;
}

export interface PersonnelFailure {
    readonly type: "PersonnelFailure";
    readonly time: number;
    readonly sequence: number;
    readonly personnel: PersonnelType;
    readonly quantity: number;
}

export interface PersonnelRestore {
    readonly type: "PersonnelRestore";
    readonly time: number;
    readonly sequence: number;
    readonly personnel: PersonnelType;
    readonly quantity: number;
}

export type SimulationEvents = PatientArrival | TreatmentComplete | ResourceFailure | ResourceRestore | PersonnelFailure | PersonnelRestore