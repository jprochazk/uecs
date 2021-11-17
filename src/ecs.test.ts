
import { World, Tag } from "./index";

class A { a = 0 }
class B { b = 0 }
class C { c = 0 }

// things that are tested implicitly:
//  - world.size()
//  - world.has()
//  - world.exists()
//  - world.emplace()
//  - world.remove()

describe("behavior", function () {
    it("creates empty entity", function () {
        const world = new World;

        world.create();
        expect(world.size()).toEqual(1);
    });

    it("creates entity with components", function () {
        const world = new World;

        const entity = world.create(new A, new B);
        expect(world.has(entity, A) && world.has(entity, B)).toBeTruthy();
    });

    it("creates entity with tags", function () {
        const world = new World;

        const entity = world.create(Tag.for("Test"));
        expect(world.has(entity, Tag.for("Test"))).toBeTruthy();
        expect(world.has(entity, Tag.for("NotTest"))).toBeFalsy();
    });

    it("creates entity with enum tags", function () {
        enum TagId { A, B }
        const world = new World;

        const entity = world.create(Tag.for(TagId.A));
        expect(world.has(entity, Tag.for(TagId.A))).toBeTruthy();
        expect(world.has(entity, Tag.for(TagId.B))).toBeFalsy();
    });

    it("creates entity with object tags", function () {
        const TagA = { toString() { return "A" } };
        const TagB = { toString() { return "B" } };
        const world = new World;

        const entity = world.create(Tag.for(TagA));
        expect(world.has(entity, Tag.for(TagA))).toBeTruthy();
        expect(world.has(entity, Tag.for(TagB))).toBeFalsy();
    });

    it("inserts empty entity", function () {
        const world = new World;

        const entity = 10;
        world.insert(10);
        expect(world.exists(entity));
        expect(world.size()).toEqual(1);
    });

    it("inserts entity with components", function () {
        const world = new World;

        const entity = 10;
        world.insert(10, new A);
        expect(world.exists(entity));
        expect(world.size()).toEqual(1);
        expect(world.has(entity, A)).toBeTruthy();
    });

    it("inserts entity with tags", function () {
        const world = new World;

        const entity = 10;
        world.insert(10, Tag.for("Test"));
        expect(world.exists(entity));
        expect(world.size()).toEqual(1);
        expect(world.has(entity, Tag.for("Test"))).toBeTruthy();
    });

    it("inserts entity with components", function () {
        const world = new World;

        const entity = 10;
        world.insert(10, new A);
        expect(world.exists(entity));
        expect(world.size()).toEqual(1);
        expect(world.has(entity, A)).toBeTruthy();
    });

    it("removes tag", function () {
        const world = new World;
        const entity = world.create(Tag.for("A"));
        expect(world.has(entity, Tag.for("A"))).toBeTruthy();
        expect(world.remove(entity, Tag.for("A"))).not.toBeUndefined();
        expect(world.has(entity, Tag.for("A"))).toBeFalsy();
    });

    it("remove doesn't throw for dead entity", function () {
        const world = new World;

        const thing = world.remove(0, A);
        expect(thing).toBeUndefined();
    });

    it("destroys entity without free", function () {
        const world = new World;

        const entity = world.create(new A);
        expect(world.size()).toEqual(1);
        world.destroy(entity);
        expect(world.size()).toEqual(0);
    });

    it("destroys entity with free", function () {
        const world = new World;

        const freeFn = jest.fn();
        class Freeable { free = freeFn }

        const entity = world.create(new Freeable);
        expect(world.size()).toEqual(1);
        world.destroy(entity);
        expect(freeFn).toBeCalled();
        expect(world.size()).toEqual(0);
    });

    it("gets assigned component", function () {
        const world = new World;

        const entity = world.create(new A);
        expect(world.get(entity, A)).not.toBeUndefined();
    });

    it("returns a non-empty view", function () {
        const world = new World;

        let expectedCount = 0;
        for (let i = 0; i < 100; ++i) {
            const entity = world.create(new A, new B);
            if (i % 3 === 0) {
                world.emplace(entity, new C);
                expectedCount++;
            }
        }

        let actualCount = 0;
        world.view(A, C).each(() => {
            actualCount++;
        });

        expect(actualCount).toEqual(expectedCount);
    });

    it("clears the world", function () {
        const world = new World;
        for (let i = 0; i < 100; ++i) {
            world.create();
        }
        expect(world.size()).toEqual(100);
        world.clear();
        expect(world.size()).toEqual(0);
    });

    it("returns all entities", function () {
        const world = new World;
        for (let i = 0; i < 100; ++i) {
            world.create();
        }

        let count = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of world.all()) {
            count++;
        }

        expect(count).toEqual(world.size());
    });

    it("view doesn't throw on unknown components", function () {
        class A { }
        const world = new World;
        for (let i = 0; i < 100; ++i) {
            world.create();
        }

        expect(() => world.view(A).each(() => { })).not.toThrow();
    });

    it("insert does not break sequence", function () {
        const world = new World;

        world.insert(100);
        expect(world.create()).toEqual(101);
        world.insert(99);
        expect(world.create()).toEqual(102);
        world.insert(200);
        expect(world.create()).toEqual(201);
    });

    it("insert does not break sequence when entity == world.entitySequence", function () {
        const world = new World;

        const a = world.insert(0);
        const b = world.create(); // should be 1

        expect(a + 1).toEqual(b);
    });

    it("view doesn't loop infinitely", function () {
        const world = new World;
        world.create(A);
        // creates six new entities
        world.view(A).each((e) => {
            // base case
            if (e > 5) return false;
            world.create(A);
        });
        expect(world.size()).toEqual(7);
    });
});

describe("examples", function () {
    it(".insert example", function () {
        class A { constructor(public value = 0) { } }
        class B { constructor(public value = 0) { } }
        const world = new World;
        const entity = world.create(new A, new B);
        expect(world.get(entity, A)).toEqual(new A);
        world.insert(entity, new A(5));
        expect(world.get(entity, A)).toEqual(new A(5));
        expect(world.get(entity, B)).toEqual(new B);
    });

    it(".destroy example", function () {
        const free = jest.fn();
        class A { free = free }
        const world = new World();
        const entity = world.create(new A);
        world.destroy(entity);
        expect(free).toBeCalled();
    });

    it(".get example", function () {
        class A { value = 50 }
        class B { }
        const world = new World();
        const entity = world.create();
        world.emplace(entity, new A);
        expect(world.get(entity, A)?.value).toEqual(50);
        expect(() => world.get(entity, A)!.value = 10).not.toThrow();
        expect(world.get(entity, A)?.value).toEqual(10);
        expect(world.get(entity, B)).toBeUndefined();
        expect(world.get(100, A)).toBeUndefined();
    });

    it(".has example", function () {
        class A { }
        const world = new World();
        const entity = world.create();
        expect(world.has(entity, A)).toBeFalsy();
        world.emplace(entity, new A);
        expect(world.has(entity, A)).toBeTruthy();
        expect(world.has(100, A)).toBeFalsy();
    });

    it(".emplace example 1", function () {
        class A { constructor(public value = 0) { } }
        const world = new World();
        const entity = world.create();
        world.emplace(entity, new A(0));
        world.emplace(entity, new A(5));
        expect(world.get(entity, A)).toEqual(new A(5));
    });

    it(".emplace example 2", function () {
        class A { constructor(public value = 0) { } }
        const world = new World;
        expect(world.exists(0)).toBeFalsy();
        expect(() => world.emplace(0, new A)).toThrowError(new Error(
            `Cannot set component "${A.name}" for dead entity ID 0`
        ));
    });

    it(".remove example", function () {
        class A { constructor(public value = 10) { } }
        const world = new World();
        const entity = world.create();
        world.emplace(entity, new A);
        expect(() => world.get(entity, A)!.value = 50).not.toThrow();
        expect(world.remove(entity, A)).toEqual(new A(50));
        expect(world.remove(entity, A)).toBeUndefined();
    });

    it(".view example", function () {
        class Fizz { }
        class Buzz { }
        const world = new World();
        for (let i = 0; i < 30; ++i) {
            const entity = world.create();
            if (i % 3 === 0) world.emplace(entity, new Fizz);
            if (i % 5 === 0) world.emplace(entity, new Buzz);
        }

        const result: number[] = [];
        world.view(Fizz, Buzz).each((n) => {
            result.push(n);
        });
        expect(result).toEqual([0, 15])
    });

    it(".view example return false", function () {
        class Test { constructor(public value: number) { } }
        const world = new World;
        for (let i = 0; i < 100; ++i) world.create(new Test(i));
        let count = 0;
        world.view(Test).each((entity, test) => {
            if (test.value === 50) {
                return false;
            }
            count += 1;
        });
        expect(count).toEqual(50);
    });

});