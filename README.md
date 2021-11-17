**μECS** is an [ECS](#what-is-ecs) library.

It is:
* 🏋️ **Lightweight**, ~3kb unpacked
* 💻 [**Easy to use**](#usage)
* ⚡ [**Extremely fast**](#benchmark)

**μECS** is available on [NPM](https://www.npmjs.com/package/uecs) and the [unpkg](https://unpkg.com/uecs@latest) CDN, for use in both browsers and Node.

### What is ECS?

**E**ntity **C**omponent **S**ystem is an architectural pattern. It it used to decouple a game's state from its logic, which makes reasoning about your game much easier. Instead of a complex game object hierarchy, you're left with *components*, composed into *entities*, all living in a shared *world*, manipulated by *systems*. It has the additional benefit of performing well on modern CPUs, due to being [data oriented](https://en.wikipedia.org/wiki/Data-oriented_design).

For a proper introduction to what ECS is, what it's aiming to fix and how it works, I recommend reading [this series of articles](http://t-machine.org/index.php/2007/11/11/entity-systems-are-the-future-of-mmog-development-part-2/).

### Usage

Visit the [this page](https://jan-prochazka.eu/uecs/) to see a full walk-through of the entire API, auto-generated documentation (which contains more examples and API explanations), as well as a simple demo!

```ts
import { World } from 'uecs';

class Position { x = 0; y = 0; }
class Velocity { x = 10; y = 10; }

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

### Benchmark

This library focuses on being small and simple, but without compromising on performance. **μECS** is one of the fastest ECS libraries available, according to [this benchmark](https://github.com/ddmills/js-ecs-benchmarks).

### Notes

Even though the library's version is currently below `1.0`, the API should be considered stable, because the library is feature-complete. The only thing that may change are the internals, in hopes of increasing performance or decreasing built size.

This is because *μECS* has been in the works for many months, but it was only made public recently. Now that it is, I'd like to see what people have to say about it- maybe there are some huge flaws which can be addressed before commiting to `1.0`.
