// used for testing, will be removed later

import { PatientGenerator } from "./generators/patientgenerator";
import { SeededRandom } from "./random/seededrandom";
import { NormalProfile } from "./config/Workloadprofiles";
import { ResourceManager } from "./resources/resourcemanager";
import { InitialResourceSnapshot } from "./resources/resourcemanager";
import { SimulationEngine } from "./simulation/SimulationEngine";

const randomSeed = new SeededRandom(123);

const generator = new PatientGenerator(
    randomSeed,
    NormalProfile
);

const patients = generator.generatePatients(5);
const resourceManager = new ResourceManager(InitialResourceSnapshot);

const simulation = new SimulationEngine(
    resourceManager,
    patients
);

simulation.RunSimulation();


