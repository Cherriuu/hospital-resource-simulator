import type { SimulationEvent } from "../models/SimulationEvent.js";

function compareEvents(a: SimulationEvent, b: SimulationEvent): number {
    if (a.time !== b.time) {
        return a.time - b.time;
    }

    return a.sequence - b.sequence;
}

export class ArrayEventQueue {
    private events: SimulationEvent[] = [];

    // if both patients arrive at the same time, we will use the sequence number to determine which patient arrived first.
    public push(event: SimulationEvent): void {
        this.events.push(event);
        this.events.sort(compareEvents);
    }

    public pop(): SimulationEvent | undefined {
        return this.events.shift();
    }

    public isEmpty(): boolean {
        return this.events.length === 0;
    }
}

export class EventQueue {
    private heap: SimulationEvent[] = [];

    // In a binary heap, children are at 2*i + 1 and 2*i + 2, and the parent is at floor((i - 1) / 2).
    private siftUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            if (compareEvents(this.heap[parentIndex], this.heap[index]) <= 0) {
                break;
            }

            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    private siftDown(index: number): void {
        while (true) {
            const leftIndex = index * 2 + 1;
            const rightIndex = index * 2 + 2;
            let smallestIndex = index;

            if (leftIndex < this.heap.length && compareEvents(this.heap[leftIndex], this.heap[smallestIndex]) < 0) {
                smallestIndex = leftIndex;
            }

            if (rightIndex < this.heap.length && compareEvents(this.heap[rightIndex], this.heap[smallestIndex]) < 0) {
                smallestIndex = rightIndex;
            }

            if (smallestIndex === index) {
                break;
            }

            [this.heap[index], this.heap[smallestIndex]] = [this.heap[smallestIndex], this.heap[index]];
            index = smallestIndex;
        }
    }

    public push(event: SimulationEvent): void {
        this.heap.push(event);
        this.siftUp(this.heap.length - 1);
    }

    public pop(): SimulationEvent | undefined {
        if (this.heap.length === 0) {
            return undefined;
        }

        const firstEvent = this.heap[0];
        const lastEvent = this.heap.pop();

        if (this.heap.length > 0 && lastEvent !== undefined) {
            this.heap[0] = lastEvent;
            this.siftDown(0);
        }

        return firstEvent;
    }

    public isEmpty(): boolean {
        return this.heap.length === 0;
    }
}