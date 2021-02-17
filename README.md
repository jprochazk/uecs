**μECS** is an [ECS](#what-is-ecs) library.

It is:
* 🏋️ **Lightweight**: Less than 4kb unpacked
* ⚡ [**Really fast**](#benchmark)
* 💻 [**Easy to use**](#usage)

### What is ECS?

**E**ntity **C**omponent **S**ystem is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance when dealing with large amounts of objects. 

In fact, because it is so efficient and makes your code so much easier to reason about, most games, from small indie games, all the way to custom-engine AAA titles, utilize some variation of ECS.

### About the library

This library tries to stay unopinionated. Where most ECS libraries act more like engines, dictating how you should structure and run your code, here you'll find only a very efficient storage for your entities and components. How you actually structure your game is entirely up to you.

To stay lean and mean, things like deferred entity destruction, resource management, component pooling, and so on, are not part of the library. It means there is more work for you, the user, but it also means there is *far* more flexibility for everyone. It doesn't require an exorbitant amount of work, either! You can see examples of advanced usage [further down](#advanced-usage).

### Usage

To best illustrate the usage of this library, here's some code:

```ts
import { World } from 'uecs';
// Components are plain classes
class Position {
    x = 0,
    y = 0
}
class Velocity {
    x = 10,
    y = 10
}
class Thing {
    value = "test";
    free() { console.log("freed"); }
}

// The `World` is the core of this library, everything revolves around it:
const world = new World;

// Here's how you'd add some entities and components:
for (let i = 0; i < 100; ++i) {
    // `World.create` accepts a list of components you want this entity to have
    world.create(new Position, new Velocity, new Thing, new Freeable);
    // This is the same as doing:
    const entity = world.create();
    world.emplace(entity, new Position);
    world.emplace(entity, new Velocity);
    world.emplace(entity, new Freeable);
}

// Systems are whatever you want them to be:
function physics(world) {
    // Here's how you'd iterate over entities:

    // You call `World.view` with a list of component types.
    // Then you call `View.each` with a callback.
    world.view(Position, Velocity).each((entity, position, velocity) => {
        // You've got access to the entity's components here, go wild!
        position.x += velocity.x;
        position.y += velocity.y;

        // You can even modify components which you didn't query for at this point
        // For example, check for the presence of a component
        if (world.has(entity, Thing)) {
            // Then retrieve it,
            const thing = world.get(entity, Thing);
            // And modify it.
            thing.value = "hello!";
        }
        // Alternatively, do the above in one go:
        const thing = world.get(entity, Thing);
        if (thing) thing.value = `modified at ${new Date().toString()}`;

        // And remove the component once you're done with it.
        // If your component has a `.free` method, you can call it here, too:
        world.remove(entity, Thing)?.free();
        // It won't be called for you, because there are cases where you don't
        // want to call `.free` on a removed component.

        // If you call `World.destroy`, `.free` will be called
        // on each component that has it:
        world.destroy(entity);

        // The return type of the view callback is `false | void`.
        // To stop the view iteration early, you can return `false`.
        // If you don't return anything, it continues on.
        return false;
    });
}
```

To see an actual example, visit the [docs](./docs).

You can see the library being used in an actual game [here](https://github.com/EverCrawl/game/blob/master/client/src/core/game/System.ts).

#### Advanced usage

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

world.size() // 100
world.get(10, Thing) // Thing { value: "entity10" }
```

Missing examples:
* Deferred entity destruction
* Component pooling
* Resource management

### Benchmark

Inspired by [ecs_benchmark](https://github.com/abeimler/ecs_benchmark), which benchmarks C++ libraries.

The benchmark is available [here](https://jsbench.me/1hkl8hiyqh/1). It attempts to update the state of 100k entities. 

The update includes doing things like allocating strings, generating random numbers, branching (if statements), and more. It attemps to reflect a *real world* scenario, but it's incredibly difficult to do so.

The op/s number is the same as the FPS counter in games. The example is a bit contrived, because you would probably have a hard time finding a scenario where you'd need to put 100k entities into your game. Nevertheless, this library can probably handle it.

On my machine, the results are:

| CPU                 | browser | operations |
|:--------------------|:--------|:----------:|
| i5-8600K @ 3.60 GHz | Firefox | ~55/s      |
| i5-8600K @ 3.60 GHz | Chrome  | ~108/s     |

More extensive benchmarks for things such as creating/deleting entities, adding/removing components coming soon.