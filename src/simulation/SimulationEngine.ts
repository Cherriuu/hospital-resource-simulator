import type { Patient } from "../models/patient";
import { EventQueue } from "./EventQueue";
import { ResourceManager } from "../resources/resourcemanager";
import type { SimulationEvent } from "../models/simulationevent";

export class SimulationEngine {
    private resourceManager: ResourceManager;
    private patients: Patient[];
    private eventQueue: EventQueue;

    // Patients who arrived but could not get resources
    private waitingPatients: Patient[] = [];

    // Current simulation time
    private currentTime: number = 0;

    // Used to break ties between events with the same time
    private sequence: number = 0;

    constructor(
        resourceManager: ResourceManager,
        patients: Patient[]
    ) {
        this.resourceManager = resourceManager;
        this.patients = patients;
        this.eventQueue = new EventQueue();
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

            // Jump the simulation clock to this event
            this.currentTime = event.time;

            if (event.type === "PatientArrival") {
                this.HandlePatientArrival(event);
            }

            if (event.type === "TreatmentComplete") {
                this.HandleTreatmentComplete(event);
            }
        }
    }

    private HandlePatientArrival(event: SimulationEvent): void {
        if (event.type !== "PatientArrival") {
            return;
        }

        const patient = this.patients.find(
            p => p.id === event.patientid
        );

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
            this.waitingPatients.push(patient);

            console.log(
                `Time ${this.currentTime.toFixed(2)}: Patient ${patient.id} is waiting`
            );
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

        this.sequence++;

        this.eventQueue.push(treatmentComplete);

        console.log(
            `Time ${this.currentTime.toFixed(2)}: Patient ${patient.id} started treatment`
        );
    }

    private HandleTreatmentComplete(
        event: SimulationEvent
    ): void {
        if (event.type !== "TreatmentComplete") {
            return;
        }

        const patient = this.patients.find(
            p => p.id === event.patientid
        );

        if (patient === undefined) {
            console.error(
                "Patient not found for treatment completion:",
                event
            );
            return;
        }

        this.resourceManager.releaseResources(patient);

        console.log(
            `Time ${this.currentTime.toFixed(2)}: Patient ${patient.id} completed treatment`
        );

        this.ProcessWaitingPatients();
    }

    private ProcessWaitingPatients(): void {
        const stillWaiting: Patient[] = [];

        for (const patient of this.waitingPatients) {
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
}