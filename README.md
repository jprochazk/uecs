**μECS** is an ECS library.

It is:
* 🏋️ Lightweight -> Under 4kb unpacked
* ⚡ Really fast -> See the [benchmark](#benchmark)
* 💻 Easy to use -> See the [usage](#usage)

### What is ECS?

ECS is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance. Because it is so efficient and makes your code so easy to reason about, most games, from small indie games, all the way to custom-engine AAA titles, utilize some variation of ECS.

### Usage

The library is unopinionated. 

Where most ECS libraries act more like engines, dictating how you should structure and run your code, this library provides only a very efficient storage for your entities and components. How you actually structure your game is entirely up to you. This is undoubtedly a very positive thing, but it does mean that you have to write *slightly* more code to do things like deferred entity destruction, resource management, component pooling, and so on.

In this library,
* Components are plain classes.
  * Required because each component type must be nominal
  * This is the *only* requirement this library puts on your code
* Systems are whatever you want them to be!
  * Your systems will access entities and components by creating a "view" into the world.
  * Views are meant to be re-used, but this is handled for you by caching each view you create.

Here is that in code, with additional notes:
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
    // You can give a component a `free` method,
    // and it will be called when the component is destroyed
    // during a call to `World.destroy(entity)`.
    free() {
        console.log("freed");
    }
}

// here's how you would instantiate a world,
const world = new World();
// add some entities into it
for (let i = 0; i < 100; ++i) {
    // and assign each one some components:
    // `World.create` accepts a list of components you want this entity to have
    world.create(new Position, new Velocity, new Thing, new Freeable);
    // This is the same as doing:
    const entity = world.create();
    world.emplace(entity, new Position);
    world.emplace(entity, new Velocity);
    world.emplace(entity, new Freeable);
}

// Systems are whatever you want them to be:
// In this case it's a plain function which accepts a `World` instance.
function physics(world) {
    // Here's how you'd iterate over entities:

    // You call `World.view` with a list of component types.
    // The component types are **constructors**, meaning you pass
    // the class directly, without creating an instance.
    // This is because components are identified using the implicit `constructor.name` 
    // property. Doing it this way means components need to be classes, BUT it means the
    // API is a cleaner and more convenient.

    // Then you call `View.each` with a callback. The first argument
    // of the callback is always the entity, the rest of the arguments are 
    // instances of whichever components you are querying for, 
    // *in the order you are querying them*.
    world.view(Position, Velocity).each((entity, position, velocity) => {
        // `View.each` is the same as an ES6 iterator, but a lot more efficient,
        // because it guarantees **no intermediate allocations**.

        // You've got access to the entity's components here, make it count!
        position.x += velocity.x;
        position.y += velocity.y;

        // You can even modify components which you didn't query for at this point
        // For example, check for the presence of a component
        if (world.has(entity, Thing)) {
            // Then retrieve it:
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

        // The return type of the view callback is `false | void`.
        // To stop the view iteration early, you can return `false`.
        // If you don't return anything, it continues on.
        return false;

        // Note that attempting to create entities within a view may cause somewhat strange
        // or confusing behavior.
        // This is because the view iterator is lazy, and doesn't actually fetch any components
        // until it the last moment. If you add new entities into the world at this point, and
        // give it the same components as you are currently querying, it will fetch that entity 
        // later on in iteration.
    });
}
```

To see an actual example, visit the [docs](./docs).

You can see the library in usage [here](https://github.com/EverCrawl/game/blob/master/client/src/core/game/System.ts).

### Benchmark

The benchmark is available [here](https://jsbench.me/1hkl8hiyqh/1).

The benchmark attempts to update the (somewhat complex) state of 100k entities. 
The op/s number is the same as the FPS counter in games. The example is a bit contrived, because you would probably have a hard time finding a scenario where you'd need to put 100k entities into your game. Nevertheless, this library can probably handle it.

On my machine, the results are:

CPU                 | operations |
:------------------ |:----------:|
i5-8600K @ 3.60 GHz |   ~100/s   |

More extensive benchmarks for things such as creating/deleting entities, adding/removing components coming soon.