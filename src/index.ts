import { PatientGenerator } from "./generators/patientgenerator";
import { SeededRandom } from "./random/seededrandom";
import { NormalProfile } from "./config/Workloadprofiles";

const randomSeed = new SeededRandom(123);

const generator = new PatientGenerator(
    randomSeed,
    NormalProfile
);

const patients = generator.generatePatients(5);

console.log(patients);