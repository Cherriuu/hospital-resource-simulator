import type { SimulationEvent } from "../models/simulationevent";

export class EventQueue {
    private events: SimulationEvent[] = [];

    // if both patients arrive at the same time, we will use the sequence number to determine which patient arrived first.
    public push(event: SimulationEvent): void {
        this.events.push(event);

        this.events.sort((a, b) => {
            if (a.time !== b.time) {
                return a.time - b.time;
            }

            return a.sequence - b.sequence;
        });
    }

    public pop(): SimulationEvent | undefined {
        return this.events.shift();
    }

    public isEmpty(): boolean {
        return this.events.length === 0;
    }
}