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

const randomSeed = new SeededRandom(123); // keep the seed the same to simulate the same patients
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

const patients = generator.generatePatients(200); // select how many patients to generate here
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

// changes that need to be made
// Run all schedulers against the same generated patients for fair comparisons.
// Reset hospital resources before every simulation run.
// Allow patients to require multiple resources at once.
// Allow patients to require multiple personnel types at once.
// Add safeguards so released resources never exceed total capacity.
// Improve and document Priority + Aging behavior.
// Decide whether FCFS should be strict or work-conserving.
// Track patients who never complete treatment.
// Track max/average waiting queue length.
// Track resource and personnel utilization over time + record metrics in dashboard.
// Record which resource caused a patient to wait + record metrics in dashboard.
// Implement resource/personnel failure and restore events.
// Support timed failure/scenario injection during simulations.
// Add automatic side-by-side scheduler comparisons.
// Stress test with a large number of patients.
// Replace EventQueue array sorting with a priority queue/min-heap if needed.
// Add an Express API for the frontend.
// Add database storage for previous simulation runs.


