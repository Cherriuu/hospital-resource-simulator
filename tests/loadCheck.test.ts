import { describe, expect, it } from "vitest";
import { NormalProfile } from "../src/config/Workloadprofiles";
import { PatientGenerator } from "../src/generators/patientgenerator";
import { checkWorkloadLoad } from "../src/metrics/loadCheck";
import { SeededRandom } from "../src/random/seededrandom";
import { InitialResourceSnapshot } from "../src/resources/resourcemanager";

describe("checkWorkloadLoad", () => {
    it("flags overload when capacity is far too low", () => {
        const generator = new PatientGenerator(new SeededRandom(5), NormalProfile);
        const patients = generator.generatePatients(300);

        const tinyCapacity = {
            resources: {
                general_ward_bed: 1,
                icu_bed: 1,
                operating_room: 1,
                isolation_room: 1,
                imaging_room: 1
            },
            personnel: {
                physician: 1,
                nurse: 1,
                surgeon: 1,
                anesthesiologist: 1
            }
        };

        const load = checkWorkloadLoad(patients, tinyCapacity);

        expect(load.overloadedResources.length).toBeGreaterThan(0);
        expect(load.overloadedResources[0].loadPercent).toBeGreaterThan(100);
    });

    it("flags no overload for normal profile with default capacity", () => {
        const generator = new PatientGenerator(new SeededRandom(123), NormalProfile);
        const patients = generator.generatePatients(1000);

        const load = checkWorkloadLoad(patients, structuredClone(InitialResourceSnapshot.total));

        expect(load.overloadedResources).toEqual([]);
    });
});
