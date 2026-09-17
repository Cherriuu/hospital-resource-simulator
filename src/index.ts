// used for testing, will be removed later

import { PatientGenerator } from "./generators/patientgenerator";
import { SeededRandom } from "./random/seededrandom";
import { NormalProfile } from "./config/Workloadprofiles";
import { ResourceManager } from "./resources/resourcemanager";
import { InitialResourceSnapshot } from "./resources/resourcemanager";

const randomSeed = new SeededRandom(123);

const generator = new PatientGenerator(
    randomSeed,
    NormalProfile
);

const patients = generator.generatePatients(5);
const resourceManager = new ResourceManager(InitialResourceSnapshot);

for (const patient of patients) {
    console.log(patient);
    resourceManager.canAllocateResources(patient);
    resourceManager.allocateResources(patient);
    console.log('Allocated resources for patient:', patient.id);
    console.log(resourceManager.getResourceSnapshot());

    console.log('Releasing resources...');
    resourceManager.releaseResources(patient);
    console.log(resourceManager.getResourceSnapshot());
}


