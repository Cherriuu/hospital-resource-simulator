import type { Patient } from "../models/Patient";

export interface Scheduler {
    orderPatients(waitingPatients: Patient[], currentTime: number): Patient[];
}