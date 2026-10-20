import type { Patient } from "../models/Patient.js";
import { ArrayEventQueue, EventQueue } from "./EventQueue.js";
import { ResourceManager } from "../resources/resourcemanager.js";
import type { SimulationEvent } from "../models/SimulationEvent.js";
import type { SimulationResult } from "../models/SimulationResult.js";
import { Scheduler } from "../scheduling/Scheduler.js";

export interface SimulationEngineOptions {
    queueType?: "heap" | "array";
}

export class SimulationEngine {
    private resourceManager: ResourceManager;
    private patients: Patient[];
    private patientsById: Map<number, Patient>;
    private eventQueue: EventQueue | ArrayEventQueue;
    private treatmentStartTimes: Map<number, number> = new Map();
    private busyTimeByType: Record<string, number> = {};
    private queueBusyTime: number = 0;
    private maxQueueLength: number = 0;
    private averageQueueLength: number = 0;
    private blockedBy: Record<string, number> = {};
    private blockedPatients: Set<number> = new Set();

    // Patients who arrived but could not get resources
    private waitingPatients: Patient[] = [];

    // Results of the simulation for each patient
    private simulationResults: SimulationResult[] = [];

    // Current simulation time
    private currentTime: number = 0;

    // Used to break ties between events with the same time
    private sequence: number = 0;

    private scheduler: Scheduler;

    constructor(
        resourceManager: ResourceManager,
        patients: Patient[],
        scheduler: Scheduler,
        options: SimulationEngineOptions = {}
    ) {
        this.resourceManager = resourceManager;
        this.patients = patients;
        this.patientsById = new Map(patients.map((patient) => [patient.id, patient]));
        this.eventQueue = options.queueType === "array" ? new ArrayEventQueue() : new EventQueue();
        this.scheduler = scheduler;
    }

    public InitializeEvents(): void {
        for (const patient of this.patients) {
            const event: SimulationEvent = {
                type: "PatientArrival",
                time: patient.arrivalTime,
                sequence: this.sequence,
                patientid: patient.id
            };

            this.eventQueue.push(event);
            this.sequence++;
        }
    }

    public RunSimulation(): void {
        // Create all of the initial PatientArrival events
        this.InitializeEvents();

        // Continue until there are no more scheduled events
        while (!this.eventQueue.isEmpty()) {
            const event = this.eventQueue.pop();

            if (event === undefined) {
                break;
            }

            this.recordTimeSlice(event.time - this.currentTime);

            // Jump the simulation clock to this event
            this.currentTime = event.time;

            if (event.type === "PatientArrival") {
                this.HandlePatientArrival(event);
            }

            if (event.type === "TreatmentComplete") {
                this.HandleTreatmentComplete(event);
            }
        }

        this.averageQueueLength = this.currentTime > 0 ? this.queueBusyTime / this.currentTime : 0;
    }

    private recordTimeSlice(gap: number): void {
        if (gap <= 0) {
            return;
        }

        const snapshot = this.resourceManager.getResourceSnapshot();

        for (const [resourceName, totalCount] of Object.entries(snapshot.total.resources)) {
            const used = totalCount - snapshot.available.resources[resourceName as keyof typeof snapshot.available.resources];
            this.busyTimeByType[resourceName] = (this.busyTimeByType[resourceName] ?? 0) + (used * gap);
        }

        for (const [personnelName, totalCount] of Object.entries(snapshot.total.personnel)) {
            const used = totalCount - snapshot.available.personnel[personnelName as keyof typeof snapshot.available.personnel];
            this.busyTimeByType[personnelName] = (this.busyTimeByType[personnelName] ?? 0) + (used * gap);
        }

        this.queueBusyTime += this.waitingPatients.length * gap;
        this.maxQueueLength = Math.max(this.maxQueueLength, this.waitingPatients.length);
    }

    private HandlePatientArrival(event: SimulationEvent): void {
        if (event.type !== "PatientArrival") {
            return;
        }

        const patient = this.patientsById.get(event.patientid);

        if (patient === undefined) {
            console.error(
                "Patient not found for arrival event:",
                event
            );
            return;
        }

        const canAllocate =
            this.resourceManager.canAllocateResources(patient);

        if (canAllocate) {
            this.resourceManager.allocateResources(patient);

            this.StartTreatment(patient);
        } else {
            this.blockPatientIfNeeded(patient);
            this.waitingPatients.push(patient);
        }
    }

    private blockPatientIfNeeded(patient: Patient): void {
        if (this.blockedPatients.has(patient.id)) {
            return;
        }

        const missingType = this.resourceManager.findMissingResource(patient);

        if (missingType !== null) {
            this.blockedBy[missingType] = (this.blockedBy[missingType] ?? 0) + 1;
            this.blockedPatients.add(patient.id);
        }
    }

    private StartTreatment(patient: Patient): void {
        const treatmentComplete: SimulationEvent = {
            type: "TreatmentComplete",

            time:
                this.currentTime +
                patient.estimatedTreatmentTime,

            sequence: this.sequence,

            patientid: patient.id
        };

        this.treatmentStartTimes.set(patient.id, this.currentTime);

        this.sequence++;

        this.eventQueue.push(treatmentComplete);
    }

    private HandleTreatmentComplete(
        event: SimulationEvent
    ): void {
        if (event.type !== "TreatmentComplete") {
            return;
        }

        const patient = this.patientsById.get(event.patientid);

        if (patient === undefined) {
            console.error(
                "Patient not found for treatment completion:",
                event
            );
            return;
        }

        const treatmentStartTime = this.treatmentStartTimes.get(patient.id);
        const startTime = treatmentStartTime ?? patient.arrivalTime;

        const result: SimulationResult = {
            patientId: patient.id,
            patientPriority: patient.priority,
            arrivalTime: patient.arrivalTime,
            treatmentStartTime: startTime,
            treatmentEndTime: this.currentTime,
            waitingTime: Math.max(0, startTime - patient.arrivalTime),
            treatmentDuration: this.currentTime - startTime
        };

        this.simulationResults.push(result);

        this.resourceManager.releaseResources(patient);

        this.treatmentStartTimes.delete(patient.id);

        this.ProcessWaitingPatients();
    }

    private ProcessWaitingPatients(): void {
        const stillWaiting: Patient[] = [];
        const orderedPatients: Patient[] = this.scheduler.orderPatients(this.waitingPatients, this.currentTime);

        for (const patient of orderedPatients) {
            const canAllocate =
                this.resourceManager.canAllocateResources(patient);

            if (canAllocate) {
                this.resourceManager.allocateResources(patient);

                this.StartTreatment(patient);
            } else {
                stillWaiting.push(patient);
            }
        }

        this.waitingPatients = stillWaiting;
    }

    public getUtilization(): Record<string, number> {
        const result: Record<string, number> = {};
        const duration = this.currentTime;

        for (const [typeName, totalCount] of Object.entries(this.resourceManager.getResourceSnapshot().total.resources)) {
            if (totalCount === 0 || duration === 0) {
                result[typeName] = 0;
                continue;
            }

            result[typeName] = (this.busyTimeByType[typeName] ?? 0) / (totalCount * duration) * 100;
        }

        for (const [typeName, totalCount] of Object.entries(this.resourceManager.getResourceSnapshot().total.personnel)) {
            if (totalCount === 0 || duration === 0) {
                result[typeName] = 0;
                continue;
            }

            result[typeName] = (this.busyTimeByType[typeName] ?? 0) / (totalCount * duration) * 100;
        }

        return result;
    }

    public getAverageQueueLength(): number {
        return this.currentTime > 0 ? this.queueBusyTime / this.currentTime : 0;
    }

    public getMaxQueueLength(): number {
        return this.maxQueueLength;
    }

    public getBlockedBy(): Record<string, number> {
        return { ...this.blockedBy };
    }

    public getUntreatedPatientsCount(): number {
        return this.waitingPatients.length;
    }

    public getSimulationResults(): SimulationResult[] {
        return this.simulationResults;
    }
}