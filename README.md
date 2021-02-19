**μECS** is an [ECS](#what-is-ecs) library.

It is:
* 🏋️ **Lightweight**, ~4kb unpacked
* 💻 [**Easy to use**](#usage)
* ⚡ [**Extremely fast**](#benchmark)

### What is ECS?

**E**ntity **C**omponent **S**ystem is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance when dealing with large amounts of objects. Many games, from indie to AAA titles, utilise some form of ECS.

### Usage

The main advantage of using *μECS* over other libraries is the vastly improved ergonomics - you don't need to register anything ahead of time. You can take full advantage of JS being a dynamic language, all while maintaining [great performance](#benchmark).

```ts
import { World } from 'uecs';

class Position { x = 0; y = 0 }
class Velocity { x = 10; y = 10 }

const world = new World;
for (let i = 0; i < 100; ++i) {
    world.create(new Position, new Velocity);
}

function physics(world, dt) {
    world.view(Position, Velocity).each((entity, position, velocity) => {
        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
    });
}
```

Here are the core concepts of the library:

* **Entity:** - A container for components.
* **Component:** - Some data.
* **System:** - Some logic.
* **World:** - A container for entities.
* **View:** - A component iterator.

In *μECS*, components are stored in arrays, and entities are used as the index. Systems are whatever you want them to be, because you can construct views at any time, which allow you to efficiently iterate over entities with a specific combination of components, commonly referred to as an *archetype*.

Visit the [this page](https://www.jan-prochazka.eu/uecs/) to see a full walk-through of the entire API, auto-generated documentation (which contains more examples and API explanations), as well as a simple demo!

### Benchmark

This library focuses on being small, but without compromising on performance. **μECS** is consistently one of the fastest ECS libraries available, according to [this benchmark](https://github.com/ddmills/js-ecs-benchmarks). *μECS* truly shines in iteration, it surpasses the second best performer, perform-ecs, by roughly 10-20%.

### Notes

Even though the library's version is currently below `1.0`, the API should be considered stable, because the library is feature-complete. The only thing that may change are the internals, in hopes of increasing performance or decreasing built size.

This is because *μECS* has been in the works for many months, but it was only made public recently. Now that it is, I'd like to see what people have to say about it- maybe there are some huge flaws which can be addressed before commiting to `1.0`.
