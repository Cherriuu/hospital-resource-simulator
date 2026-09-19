// used for testing, will be removed later

import { PatientGenerator } from "./generators/patientgenerator";
import { SeededRandom } from "./random/seededrandom";
import { NormalProfile } from "./config/Workloadprofiles";
import { MassCasualtyProfile } from "./config/Workloadprofiles";
import { FluSurgeProfile } from "./config/Workloadprofiles"; 
import { ResourceManager } from "./resources/resourcemanager";
import { InitialResourceSnapshot } from "./resources/resourcemanager";
import { SimulationEngine } from "./simulation/SimulationEngine";
import type { Scheduler } from "./scheduling/Scheduler";

import { input } from '@inquirer/prompts';
import { PriorityandAgingScheduler } from "./scheduling/Priority+Aging";
import { FCFSScheduler } from "./scheduling/FCFSScheduler";
import { PriorityScheduler } from "./scheduling/PriorityScheduler";
import type { WorkloadProfile } from "./models/workloadprofile";
import { MetricsCollector } from "./metrics/MetricsCollector";

const randomSeed = new SeededRandom(123);
const selectedProfile = await input({ message: "Type a workload profile (NORMAL, MASS_CASUALTY, FLU_SURGE):" });
console.log('Selected workload profile:', selectedProfile);

const selectedScheduler = await input({ message: "Type a scheduling algorithm (FCFS, Priority, PriorityAging):"});
console.log('Selected scheduling algorithm:', selectedScheduler);

let workloadProfile: WorkloadProfile;
// workload profile selection
if (selectedProfile === "NORMAL") {
    workloadProfile = NormalProfile;
} else if (selectedProfile === "MASS_CASUALTY") {
    workloadProfile = MassCasualtyProfile;
} else if (selectedProfile === "FLU_SURGE") {
    workloadProfile = FluSurgeProfile;
} else {
    throw new Error(`Unknown workload profile: ${selectedProfile}`);
}

// generate patients
const generator = new PatientGenerator(randomSeed, workloadProfile);

const patients = generator.generatePatients(5);
let scheduler: Scheduler;

// scheduler selection
if (selectedScheduler === "FCFS") {
    scheduler = new FCFSScheduler();
} else if (selectedScheduler === "Priority") {
    scheduler = new PriorityScheduler();
} else if (selectedScheduler === "PriorityAging") {
    scheduler = new PriorityandAgingScheduler();
} else {
    throw new Error('Unknown scheduler')
}

const resourceManager = new ResourceManager(InitialResourceSnapshot);

const simulation = new SimulationEngine(resourceManager, patients, scheduler);

simulation.RunSimulation();

const simulationResults = simulation.getSimulationResults();

const metricsCollector = new MetricsCollector(simulationResults);

const metrics = metricsCollector.collectMetrics();

console.log('Metric results:');
console.log(metrics);


