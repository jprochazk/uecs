
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

describe("ECS", function () {
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
        for (const _ of world.all()) {
            count++;
        }

        expect(count).toEqual(world.size());
    });
});