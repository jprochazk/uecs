**μECS** is an [ECS](#what-is-ecs) library.

It is:
* 🏋️ **Lightweight**: Less than 4kb unpacked
* ⚡ [**Really fast**](#benchmark)
* 💻 [**Easy to use**](#usage)

### What is ECS?

**E**ntity **C**omponent **S**ystem is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance when dealing with large amounts of objects. 

In fact, because it is so efficient and makes your code so much easier to reason about, most games, from small indie games, all the way to custom-engine AAA titles, utilize some variation of ECS.

### About the library

*μECS* tries to stay unopinionated. Where most ECS libraries act more like engines, dictating how you should structure and run your code, here you'll find only a very efficient storage for your entities and components. How you actually structure your game is entirely up to you.

To stay lean and mean, things like deferred entity destruction, resource management, component pooling, and so on, are not part of the library. It means there is more work for you, the user, but it also means there is far more flexibility for *every* user's specific requirements. Rest assured, using the library doesn't require an exorbitant amount of work. Quite the opposite, it's very straightforward. You can see examples of advanced usage [further down](#advanced-usage).

### Usage

To best illustrate the usage of this library, here's some code:

```ts
import { World } from 'uecs';

// Create some components
class Position { x = 0; y = 0 }
class Velocity { x = 10; y = 10 }
class Thing {
    value = "test";
    free() { console.log("freed"); }
}

// Create a `World` and add some entities
const world = new World;
for (let i = 0; i < 100; ++i) {
    world.create(new Position, new Velocity, new Thing);
}

// Here's what a simple system may look like:
function physics(world) {
    world.view(Position, Velocity).each((entity, position, velocity) => {
        position.x += velocity.x;
        position.y += velocity.y;
    });
}
```

Here are the core concepts of the library:

**Entity:** an opaque identifier. Entities are used to retrieve components from storage - simply put, it's an array index.
**Component:** - some state. Components store all your data. In *μECS*, components are plain ES6 classes.
**System:** - some logic. Systems house your game rules. It's a bit of code which accesses some entities and components, modifies them, creates new ones, destroys them, and so on.
**World:** - a container. It manages entity and component lifetimes and allows you to flexibly and efficiently utilise them.
**View:** - a query. A non-owning container of components. They are what makes this library fast.

Every part of the API surface is thoroughly documented, together with comprehensive examples.

To see more complex examples, visit the [documentation](./docs).

You can see the library being used in an actual game [here](https://github.com/EverCrawl/game/blob/master/client/src/core/game/System.ts).

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

Inspired by [ecs_benchmark](https://github.com/abeimler/ecs_benchmark), which is a performance comparison of many C++ ECS libraries.

The benchmark is available [here](https://jsbench.me/1hkl8hiyqh/1). It attempts to update the state of 100k entities. 

The update includes doing things like allocating strings, generating random numbers, branching (if statements), and more. It attemps to reflect a *real world* scenario.

The op/s number is the same as the FPS counter in games. The example is a bit contrived, because you would probably have a hard time finding a scenario where you'd need to put 100k entities into your game. Nevertheless, this library can probably handle it.

On my machine, the results are:

| CPU                 | browser | operations |
|:--------------------|:--------|:----------:|
| i5-8600K @ 3.60 GHz | Firefox | ~55/s      |
| i5-8600K @ 3.60 GHz | Chrome  | ~108/s     |

More extensive benchmarks for things such as creating/deleting entities, adding/removing components coming soon.