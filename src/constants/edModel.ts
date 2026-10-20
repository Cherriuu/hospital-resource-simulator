import type { PatientPriority, PersonnelType } from "../models/Patient.js";

// California ED nurse staffing ratios:
// - 1:4 for general ED assignments
// - 1:2 for critical/emergent assignments
// - 1:1 for trauma/resuscitation
// Physician 1:8 is a modeling assumption for this simulator.
export const STAFF_SLOT_CAPACITY: Record<PersonnelType, number> = {
    nurse: 4,
    physician: 8
};

// NHAMCS 2009-2011 mean treatment times (minutes), WestJEM Table 2.
export const TRIAGE_TREATMENT_MEAN_MINUTES: Record<PatientPriority, number> = {
    resuscitation: 220,
    emergent: 280,
    urgent: 237,
    less_urgent: 157,
    non_urgent: 135
};
