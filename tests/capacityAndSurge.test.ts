import { describe, expect, it } from "vitest";
import { FluSurgeProfile, NormalProfile } from "../src/config/Workloadprofiles";
import { PatientGenerator } from "../src/generators/patientgenerator";
import { MetricsCollector } from "../src/metrics/MetricsCollector";
import type { Patient } from "../src/models/Patient";
import { SeededRandom } from "../src/random/seededrandom";
import { InitialResourceSnapshot, ResourceManager } from "../src/resources/resourcemanager";
import { PriorityScheduler } from "../src/scheduling/PriorityScheduler";
import { SimulationEngine } from "../src/simulation/SimulationEngine";

// Share of non-resuscitation patients who use an isolation room (resuscitation patients never do)
function isolationShare(patients: Patient[]): number {
    const eligible = patients.filter((patient) => patient.priority !== "resuscitation");
    const isolated = eligible.filter((patient) => patient.resourcesNeeded.resources.isolation_room === 1);

    return isolated.length / eligible.length;
}

describe("Default capacity", () => {
    it("keeps resuscitation waits short on a normal day", () => {
        const patients = new PatientGenerator(new SeededRandom(123), NormalProfile).generatePatients(2000);
        const simulation = new SimulationEngine(
            new ResourceManager(structuredClone(InitialResourceSnapshot)),
            patients,
            new PriorityScheduler()
        );

        simulation.RunSimulation();

        const metrics = new MetricsCollector(
            simulation.getSimulationResults(),
            simulation.getUntreatedPatientsCount(),
            patients.length
        ).collectMetrics();

        expect(metrics.averageWaitingTimeResuscitation ?? 0).toBeLessThan(30);
    });
});

describe("Flu Surge", () => {
    it("uses about 20% isolation during the 48-hour surge and about 3% after", () => {
        const patients = new PatientGenerator(new SeededRandom(123), FluSurgeProfile).generatePatients(5000);
        const surgeEndMinutes = 48 * 60;

        const duringSurge = patients.filter((patient) => patient.arrivalTime < surgeEndMinutes);
        const afterSurge = patients.filter((patient) => patient.arrivalTime >= surgeEndMinutes);

        expect(isolationShare(duringSurge)).toBeCloseTo(0.20, 1);
        expect(isolationShare(afterSurge)).toBeCloseTo(0.03, 1);
    });
});

describe("All-or-nothing allocation", () => {
    it("allocates nothing when the bed is free but nurse slots are not", () => {
        // 1 ED bed and 1 resus bay are free, but 0 nurses means 0 nurse slots
        const manager = new ResourceManager({
            total: {
                resources: { ed_bed: 1, resus_bay: 1, isolation_room: 0 },
                personnel: { physician: 1, nurse: 0 }
            },
            available: {
                resources: { ed_bed: 1, resus_bay: 1, isolation_room: 0 },
                personnel: { physician: 1, nurse: 0 }
            }
        });

        const patient: Patient = {
            id: 1,
            name: "Patient-1",
            age: 40,
            arrivalTime: 0,
            estimatedTreatmentTime: 60,
            priority: "urgent",
            resourcesNeeded: {
                resources: { ed_bed: 1 },
                personnel: { nurse: 1, physician: 1 }
            }
        };

        const before = structuredClone(manager.getResourceSnapshot());

        expect(manager.canAllocateResources(patient)).toBe(false);

        manager.allocateResources(patient);

        expect(manager.getResourceSnapshot()).toEqual(before);
    });
});
