**μECS** is an ECS library.

It is:
* 🏋️ Lightweight -> Under 4kb unpacked
* ⚡ Really fast -> See the [benchmark](#benchmark)
* 💻 Easy to use -> See the [usage](#usage)

### What is ECS?

ECS is an architectural pattern. It it used to decouple a game's state from its logic. It also boasts *extremely* fast performance. Because it is so efficient and makes your code so easy to reason about, most games, from small indie games, all the way to custom-engine AAA titles, utilize some variation of ECS.

### Usage

The library is unopinionated. 

Where most ECS libraries act more like engines, dictating how you should structure and run your systems, this library provides only a very efficient storage for your entities and components. How you actually structure your game is entirely up to you. On top of that, components are *plain ES6 classes*.

You start by creating a `World`, adding some entities into it,
assigning those entities some components, and then running some
systems, in which you iterate over the `World`.

For a full example

You can see the library in a real scenario [here](https://github.com/EverCrawl/game/blob/master/client/src/core/game/System.ts).

### Benchmark

The benchmark is available [here](https://jsbench.me/1hkl8hiyqh/1).

The benchmark attempts to update the (somewhat complex) state of 100k entities. 
The op/s number is the same as the FPS counter in games. The example is a bit contrived, because you would probably have a hard time finding a scenario where you'd need to put 100k entities into your game. Nevertheless, this library can probably handle it.

On my machine, the results are:

CPU                 | operations |
:------------------ |:----------:|
i5-8600K @ 3.60 GHz |   ~100/s   |

More extensive benchmarks for things such as creating/deleting entities, adding/removing components coming soon.