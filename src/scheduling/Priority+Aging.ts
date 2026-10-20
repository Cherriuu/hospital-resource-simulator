import type { Patient } from "../models/Patient.js";
import type { Scheduler } from "./Scheduler.js";

const priorityRank = {
    non_urgent: 1,
    less_urgent: 2,
    urgent: 3,
    emergent: 4,
    resuscitation: 5
};

// Each full hour of waiting raises a patient's priority by one level.
export const AGING_INTERVAL_MINUTES = 60;

// Waiting can raise a patient by at most two levels.
export const MAX_AGING_BONUS = 2;

// Aging can lift a lower-acuity patient up to the urgent level but never past it,
// so emergent and resuscitation patients are never outranked by someone who has simply waited longer.
const HIGHEST_AGED_RANK = priorityRank.urgent;

export function effectivePriority(patient: Patient, currentTime: number): number {
    const baseRank = priorityRank[patient.priority];

    // Patients already at or above the cap don't age
    if (baseRank >= HIGHEST_AGED_RANK) {
        return baseRank;
    }

    const waitingTime = currentTime - patient.arrivalTime;
    const agingBonus = Math.min(Math.floor(waitingTime / AGING_INTERVAL_MINUTES), MAX_AGING_BONUS);

    return Math.min(baseRank + agingBonus, HIGHEST_AGED_RANK);
}

export class PriorityandAgingScheduler implements Scheduler {

    public orderPatients(waitingPatients: Patient[], currentTime: number): Patient[] {

        const copyOfWaitingPatients = waitingPatients.slice();

        copyOfWaitingPatients.sort((a, b) => {
            const aEffective = effectivePriority(a, currentTime);
            const bEffective = effectivePriority(b, currentTime);

            if (aEffective !== bEffective) {
                return bEffective - aEffective;
            }

            // Tied after aging: whoever has waited longest goes first
            return a.arrivalTime - b.arrivalTime;
        });

        return copyOfWaitingPatients;
    }
}
