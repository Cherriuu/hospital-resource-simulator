// a variable seed whose type is a number is going to be assigned to the private variable state. 
// when you pass a number through the constructor, it will be used to initialize the state of the random number generator.

export class SeededRandom {

    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    // Linear congruential generator instead of rand
    // generates a pseudo-random number between 0 and 1
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