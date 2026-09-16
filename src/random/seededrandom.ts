export class SeededRandom {

    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    // Linear congruential generator
    next(): number {
        this.state = (this.state * 1664525 + 1013904223) % 4294967296;

        return this.state / 4294967296;
    }

    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    integer(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    chance(probability: number): boolean {
        return this.next() < probability;
    }
}