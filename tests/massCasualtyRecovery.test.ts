import { describe, expect, it } from "vitest";
import { MassCasualtyProfile } from "../src/config/Workloadprofiles";
import { PatientGenerator } from "../src/generators/patientgenerator";
import { MetricsCollector } from "../src/metrics/MetricsCollector";
import type { WorkloadProfile } from "../src/models/WorkloadProfile";
import { SeededRandom } from "../src/random/seededrandom";
import { InitialResourceSnapshot, ResourceManager } from "../src/resources/resourcemanager";
import { FCFSScheduler } from "../src/scheduling/FCFSScheduler";
import { SimulationEngine } from "../src/simulation/SimulationEngine";

function runAverageWait(profile: WorkloadProfile): number {
    const generator = new PatientGenerator(new SeededRandom(123), profile);
    const patients = generator.generatePatients(1000);
    const scheduler = new FCFSScheduler();
    const resourceManager = new ResourceManager(structuredClone(InitialResourceSnapshot));

    const simulation = new SimulationEngine(resourceManager, patients, scheduler);
    simulation.RunSimulation();

    const metrics = new MetricsCollector(
        simulation.getSimulationResults(),
        simulation.getUntreatedPatientsCount(),
        patients.length
    ).collectMetrics();

    return metrics.averageWaitingTime ?? 0;
}

describe("Mass casualty bounded surge", () => {
    it("has far lower average wait than the previous always-40/hour profile", () => {
        const legacyProfile: WorkloadProfile = {
            event_type: "MASS_CASUALTY",
            patient_rate: 40,
            priority_distribution: { ...MassCasualtyProfile.surge!.priority_distribution },
            treatment_range: MassCasualtyProfile.treatment_range,
            resource_probability: MassCasualtyProfile.resource_probability
        };

        const oldAverageWait = runAverageWait(legacyProfile);
        const newAverageWait = runAverageWait(MassCasualtyProfile);

        expect(
            newAverageWait,
            `Expected a much lower wait with bounded surge. old=${oldAverageWait.toFixed(2)} new=${newAverageWait.toFixed(2)}`
        ).toBeLessThan(oldAverageWait * 0.5);
    });
});
