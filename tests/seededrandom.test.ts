import { describe, expect, it } from "vitest";
import { SeededRandom } from "../src/random/seededrandom";

describe("SeededRandom", () => {
    it("gives the same sequence for the same seed", () => {
        const random1 = new SeededRandom(42);
        const random2 = new SeededRandom(42);

        const sequence1 = Array.from({ length: 20 }, () => random1.next());
        const sequence2 = Array.from({ length: 20 }, () => random2.next());

        expect(sequence1).toEqual(sequence2);
    });

    it("gives different sequences for different seeds", () => {
        const random1 = new SeededRandom(42);
        const random2 = new SeededRandom(43);

        const sequence1 = Array.from({ length: 20 }, () => random1.next());
        const sequence2 = Array.from({ length: 20 }, () => random2.next());

        expect(sequence1).not.toEqual(sequence2);
    });

    it("keeps next() in the range [0, 1)", () => {
        const random = new SeededRandom(1234);

        for (let i = 0; i < 10000; i++) {
            const value = random.next();

            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it("keeps range(), integer(), and chance() inside their valid bounds", () => {
        const random = new SeededRandom(9876);

        const rangeValue = random.range(10, 20);
        expect(rangeValue).toBeGreaterThanOrEqual(10);
        expect(rangeValue).toBeLessThan(20);

        const integerValue = random.integer(3, 9);
        expect(integerValue).toBeGreaterThanOrEqual(3);
        expect(integerValue).toBeLessThanOrEqual(9);

        expect(random.chance(0)).toBe(false);
        expect(random.chance(1)).toBe(true);
    });
});
