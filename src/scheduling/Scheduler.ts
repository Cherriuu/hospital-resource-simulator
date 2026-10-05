import type { Patient } from "../models/Patient.js";

export interface Scheduler {
    orderPatients(waitingPatients: Patient[], currentTime: number): Patient[];
}