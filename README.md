**μECS** is an ECS library.

With the ECS paradigm, you can decouple your game's state from its logic, among other benefits,
such as *extremely* fast performance. Most games, from ones built in the Unity or Unreal engines, 
all the way to custom-engine AAA titles, utilize some variation of the ECS paradigm.

This library's main goals are to be lightweight and user-friendly, but most importantly, to be fast.

It offers:
    - Light weight -> Under 4 kb unpacked size
    - Performance -> See the [benchmark](#benchmark)
    - Flexibility -> See the [examples](#examples)

### Examples

You can see the library in a real scenario [here](https://github.com/EverCrawl/game/blob/master/client/src/core/game/System.ts).

### Benchmark

The benchmark is available [here](https://jsbench.me/1hkl8hiyqh/1).

The benchmark attempts to update the (somewhat complex) state of 100k entities. 
The op/s number is the same as the FPS counter in games.

On my machine, the results are:

| CPU                 | operations |
|: ------------------ |:----------:|
| i5-8600K @ 3.60 GHz |   ~100/s   |