import express from "express";

import { PatientGenerator } from "../generators/patientgenerator.js";
import { SeededRandom } from "../random/seededrandom.js";

import {
    NormalProfile,
    MassCasualtyProfile,
    FluSurgeProfile
} from "../config/Workloadprofiles.js";

import type { WorkloadProfile } from "../models/WorkloadProfile.js";

import {
    ResourceManager,
    InitialResourceSnapshot
} from "../resources/resourcemanager.js";

import { SimulationEngine } from "../simulation/SimulationEngine.js";

import type { Scheduler } from "../scheduling/Scheduler.js";
import { FCFSScheduler } from "../scheduling/FCFSScheduler.js";
import { PriorityScheduler } from "../scheduling/PriorityScheduler.js";
import { PriorityandAgingScheduler } from "../scheduling/Priority+Aging.js";

import { MetricsCollector } from "../metrics/MetricsCollector.js";

const app = express();
const MAX_PATIENT_COUNT = 10_000;
const MAX_CAPACITY_VALUE = 1_000;

const RESOURCE_KEYS = [
    "general_ward_bed",
    "icu_bed",
    "operating_room",
    "isolation_room",
    "imaging_room"
] as const;

const PERSONNEL_KEYS = [
    "physician",
    "nurse",
    "surgeon",
    "anesthesiologist"
] as const;

function validateCapacity(capacity: unknown): { resources: Record<string, number>; personnel: Record<string, number> } {
    const defaultCapacity = structuredClone(InitialResourceSnapshot.total);

    if (capacity === undefined) {
        return defaultCapacity;
    }

    if (capacity === null || typeof capacity !== "object" || Array.isArray(capacity)) {
        throw new Error("capacity must be an object");
    }

    const capacityObject = capacity as Record<string, unknown>;
    const unknownTopLevelKeys = Object.keys(capacityObject).filter(
        key => key !== "resources" && key !== "personnel"
    );

    if (unknownTopLevelKeys.length > 0) {
        throw new Error(`capacity.${unknownTopLevelKeys[0]} is not allowed`);
    }

    if (capacityObject.resources === undefined || capacityObject.personnel === undefined) {
        const missingKey = capacityObject.resources === undefined ? "resources" : "personnel";
        throw new Error(`capacity.${missingKey} is required`);
    }

    const resources = capacityObject.resources as Record<string, unknown>;
    const personnel = capacityObject.personnel as Record<string, unknown>;

    const unknownResourceKeys = Object.keys(resources).filter(
        key => !RESOURCE_KEYS.includes(key as typeof RESOURCE_KEYS[number])
    );

    if (unknownResourceKeys.length > 0) {
        throw new Error(`capacity.resources.${unknownResourceKeys[0]} is not allowed`);
    }

    const unknownPersonnelKeys = Object.keys(personnel).filter(
        key => !PERSONNEL_KEYS.includes(key as typeof PERSONNEL_KEYS[number])
    );

    if (unknownPersonnelKeys.length > 0) {
        throw new Error(`capacity.personnel.${unknownPersonnelKeys[0]} is not allowed`);
    }

    const validatedResources: Record<string, number> = {};
    for (const key of RESOURCE_KEYS) {
        if (!(key in resources)) {
            throw new Error(`capacity.resources.${key} is required`);
        }

        const value = resources[key];

        if (!Number.isInteger(value) || value < 0 || value > MAX_CAPACITY_VALUE) {
            throw new Error(`capacity.resources.${key} must be a whole number between 0 and ${MAX_CAPACITY_VALUE}`);
        }

        validatedResources[key] = value;
    }

    const validatedPersonnel: Record<string, number> = {};
    for (const key of PERSONNEL_KEYS) {
        if (!(key in personnel)) {
            throw new Error(`capacity.personnel.${key} is required`);
        }

        const value = personnel[key];

        if (!Number.isInteger(value) || value < 0 || value > MAX_CAPACITY_VALUE) {
            throw new Error(`capacity.personnel.${key} must be a whole number between 0 and ${MAX_CAPACITY_VALUE}`);
        }

        validatedPersonnel[key] = value;
    }

    return {
        resources: validatedResources,
        personnel: validatedPersonnel
    };
}

app.use(express.json());


// Health check
app.get("/api/health", (req, res) => {
    res.json({
        message: "Hospital Simulator API is running"
    });
});


// Run simulation
app.post("/api/simulations", (req, res) => {
    try {
        const {
            workloadProfile,
            schedulingAlgorithm,
            patientCount,
            randomSeed,
            capacity
        } = req.body;


        // Validate request
        if (
            !workloadProfile ||
            !schedulingAlgorithm ||
            patientCount === undefined ||
            randomSeed === undefined
        ) {
            return res.status(400).json({
                error: "Missing simulation configuration"
            });
        }

        if (
            !Number.isInteger(patientCount) ||
            patientCount <= 0 ||
            patientCount > MAX_PATIENT_COUNT
        ) {
            return res.status(400).json({
                error: "Patient count must be between 1 and 10,000"
            });
        }


        if (!Number.isFinite(randomSeed)) {
            return res.status(400).json({
                error: "Random seed must be a valid number"
            });
        }

        let normalizedCapacity;

        try {
            normalizedCapacity = validateCapacity(capacity);
        } catch (error) {
            const message = error instanceof Error ? error.message : "capacity is invalid";
            return res.status(400).json({
                error: message
            });
        }

        let selectedProfile: WorkloadProfile;

        if (workloadProfile === "NORMAL") {
            selectedProfile = NormalProfile;
        }
        else if (workloadProfile === "MASS_CASUALTY") {
            selectedProfile = MassCasualtyProfile;
        }
        else if (workloadProfile === "FLU_SURGE") {
            selectedProfile = FluSurgeProfile;
        }
        else {
            return res.status(400).json({
                error: `Unknown workload profile: ${workloadProfile}`
            });
        }

        let scheduler: Scheduler;

        if (schedulingAlgorithm === "FCFS") {
            scheduler = new FCFSScheduler();
        }
        else if (schedulingAlgorithm === "PRIORITY") {
            scheduler = new PriorityScheduler();
        }
        else if (schedulingAlgorithm === "PRIORITY_AGING") {
            scheduler = new PriorityandAgingScheduler();
        }
        else {
            return res.status(400).json({
                error: `Unknown scheduling algorithm: ${schedulingAlgorithm}`
            });
        }

        const seededRandom = new SeededRandom(randomSeed);

        const generator = new PatientGenerator(
            seededRandom,
            selectedProfile
        );

        const patients =
            generator.generatePatients(patientCount);

        const resourceSnapshot = {
            total: {
                resources: { ...normalizedCapacity.resources },
                personnel: { ...normalizedCapacity.personnel }
            },
            available: {
                resources: { ...normalizedCapacity.resources },
                personnel: { ...normalizedCapacity.personnel }
            }
        };

        const resourceManager =
            new ResourceManager(resourceSnapshot);

        const simulation = new SimulationEngine(
            resourceManager,
            patients,
            scheduler
        );

        simulation.RunSimulation();

        const simulationResults =
            simulation.getSimulationResults();

        const metricsCollector =
            new MetricsCollector(
                simulationResults,
                simulation.getUntreatedPatientsCount(),
                patientCount
            );

        const metrics =
            metricsCollector.collectMetrics();


        console.log("Simulation completed:", {
            workloadProfile,
            schedulingAlgorithm,
            patientCount,
            randomSeed
        });

        res.json({
            averageWait:
                metrics.averageWaitingTime ?? 0,

            medianWait:
                metrics.medianWaitingTime ?? 0,

            p95Wait:
                metrics.p95WaitingTime ?? 0,

            maxWait:
                metrics.maxWaitingTime ?? 0,

            percentWaited:
                metrics.waitingPercentage ?? 0,

            throughput:
                metrics.throughput ?? 0,

            completedPatients:
                metrics.completedPatients,

            untreatedPatients:
                metrics.untreatedPatients ?? 0,

            requestedPatients:
                metrics.requestedPatients ?? patientCount,

            simulationDuration:
                metrics.simulationDuration ?? 0,

            averageWaitByPriority: {
                nonUrgent:
                    metrics.averageWaitingTimeNonUrgent ?? 0,

                lessUrgent:
                    metrics.averageWaitingTimeLessUrgent ?? 0,

                urgent:
                    metrics.averageWaitingTimeUrgent ?? 0,

                emergent:
                    metrics.averageWaitingTimeEmergent ?? 0,

                resuscitation:
                    metrics.averageWaitingTimeResuscitation ?? 0
            }
        });

    } catch (error) {

        console.error(
            "Simulation failed:",
            error
        );

        res.status(500).json({
            error: "Simulation failed"
        });
    }
});


export default app;
