**μECS** is an [ECS](#what-is-ecs) library.

It is:
* 🏋️ **Lightweight**: Less than 4kb unpacked
* ⚡ [**Really fast**](#benchmark)
* 💻 [**Easy to use**](#usage)

### What is ECS?

**E**ntity **C**omponent **S**ystem is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance when dealing with large amounts of objects. 

In fact, because it is so efficient and makes your code so much easier to reason about, most games, from small indie games, all the way to custom-engine AAA titles, utilize some variation of ECS.

### About the library

*μECS* is unopinionated. Where most ECS libraries act more like engines, dictating how you should structure and run your code, here you'll find only a very efficient storage for your entities and components.

The main advantage of using *μECS* over others is the vastly improved ergonomics - you don't need to register anything ahead of time, not even queries (called *views* in *μECS*). 

It's also quite easy to build more complex features on top of *μECS*, such as deferred destruction, component pooling, or serialization, as you'll see further below.

### Usage

Starting with a simple example, this is how you'd update the position of some entities:

```ts
import { World } from 'uecs';

// Create some components - Plain classes!
class Position { x = 0; y = 0 }
class Velocity { x = 10; y = 10 }

// Instantiate a World
const world = new World;
// And add some entities
for (let i = 0; i < 100; ++i) {
    // Give each entity a Position and Velocity component
    world.create(new Position, new Velocity);
}

// And here is our system, it can be anything we want it to be.
// In this case, it's a plain function, which views entities
// with `Position` and `Velocity` components.
const physics = (world, dt) => world
    .view(Position, Velocity)
    .each((entity, position, velocity) => {
        // Liftoff!
        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
    });

const TARGET_MS = 1000 / 60;
let last = window.performance.now();
const loop = (now) => {
    let dt = (now - last) / TARGET_MS;
    last = now;

    physics(world, dt);
    // ... collisions, drawing, AI, etc.
    // go wild!

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

Here are the core concepts of the library:

* **Entity:** - A container for components.
* **Component:** - Some data.
* **System:** - Some logic.
* **World:** - A container for entities.
* **View:** - A component *combination* iterator.

Visit the [this page](https://www.jan-prochazka.eu/uecs/) to see the auto-generated documentation, and some examples.

You can see the library being used in an actual game [here](https://github.com/EverCrawl/game/tree/master/client).

#### Advanced usage

**Inserting entities**
```ts
import { World, Tag, Component } from "uecs";

// Insert an entity with a specific ID

// This is useful for serialization or networking,
// where you don't want the entity IDs to change
// across different runs or machines.

let world = new World;
world.insert(10);
```

**Tags**
```ts
import { World, Tag } from "uecs";

const world = new World;

// Tags work similarly to JS Symbols.

// They create a unique stateless type,
// which you can use to give entities
// additional identification.

// You use it by calling `Tag.for` with the Tag name:
world.create(Tag.for("Player"));
world.create(Tag.for("Enemy"));

// And you use it the same way when creating views:
world.view(Tag.for("Enemy")).each((entity) => { /* ... */ });
world.view(Tag.for("Player")).each((entity) => { /* ... */ });
```

**Simple serialization**
```js
class Thing { constructor(value) { this.value = value; } }
// Put it on the global object, so we can retrieve the class by its name later
globalThis.Thing = Thing;

// Populate world
let world = new World;
for (let i = 1; i <= 100; ++i) {
    world.create(new Thing(`entity${i}`));
}
// Serialize...
let serialized = {};
for (const entity of world.all()) {
    serialized[entity] = {
        Thing: world.get(entity, Thing)
    }
}
let data = JSON.stringify(serialized);
// Save to a file, send over the network, etc.

// Deserialize...
const deserialized = JSON.parse(data);
let world = new World;
for (const entity of Object.keys(deserialized)) {
    const components = [];
    for (const type of Object.keys(deserialized[entity])) {
        // Create an instance of the component from the deserialized properties
        const component = Object.create(globalThis[type].prototype, { value: deserialized[entity][type] });
        components.push(component);
    }
    // And insert it into the world
    world.insert(parseInt(entity), ...components);
}

world.size(); // 100
world.get(10, Thing); // Thing { value: "entity10" }
```

Missing examples:
* Deferred entity destruction
* Component pooling
* Resource management

### Benchmark

**μECS** is consistently the fastest ECS library available, according to [js-ecs-benchmarks](https://github.com/ddmills/js-ecs-benchmarks).