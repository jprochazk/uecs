<script src="https://unpkg.com/uecs@latest"></script>

After reading through this page, you'll be able to understand what's happening in this code snippet:
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

### World

Everything revolves around a `World` instance. The `World` stores your entities, and their components.
```ts
const world = new World;
```

#### Working with entities

Entities in *μECS* are numbers:
```ts
console.log(typeof world.create()); // "number"
```

You can create them:
```ts
const entity = world.create();
```
And destroy them:
```ts
world.destroy(entity);
```
When you destroy an entity, all of its components are destroyed, too. If your component has a `.free()` method, this method will be called:
```ts
class Test { free() { console.log("freed!") } }
const entity = world.create(new Test);
world.destroy(entity); // logs "freed!"
```

You can also insert a specific entity ID:
```ts
world.insert(entity);
```
Which is useful for when you're receiving entities from a server, or reading them from a file.

Here is how to check if an entity exists:
```ts
if (world.exists(entity)) {
    // ...
}
```

This is how you iterate over every entity:
```ts
for (const entity of world.all()) {
    // ...
}
```

And lastly, this is how you clear the entire world, destroying all entities:
```ts
world.clear();
```

#### Working with components

You define components as plain ES6 classes. This is the only requirement the library places on your code. There are no restrictions to what they can contain or how you instantiate them:
```ts
class MyComponent {
    value = 0
}
```
This is because you are in charge of creating and passing component instances to the `World`:
```ts
const component = new MyComponent;
const entity = world.create();
world.emplace(entity, component);
```
This has a number of benefits, such as being able to do your own object pooling and resource management, without having to depend on this library doing it the *right* way. There are plenty of existing libraries which can do this for you, and this means it's a breeze to integrate them!

The above is quite verbose, and there is a better way:
```ts
const entity = world.create(new MyComponent);
```
`World.create` optionally takes a variable amount of arguments, each being a component instance. When the entity is created, all the components are automatically emplaced onto it.

`World.insert` is consistent with `World.create`, and takes a variable amount of component instances:
```ts
world.insert(entity, new A, new B, new C, ...);
```

Here's how you remove a component:
```ts
world.remove(entity, MyComponent);
```
It accepts the class directly, instead of a string name or component ID.

`World.remove` returns the removed component, as well:
```ts
const component = world.remove(entity, MyComponent);
```
If the entity did not have the component, or if the entity doesn't exist, the method returns `undefined`.

You can also check if an entity has a specific component:
```ts
world.has(entity, MyComponent);
```
Similarly to `World.remove`, it accepts the class of the component you want to check.

Here's how you get a component from an entity:
```ts
const component = world.get(entity, MyComponent);
```
If the entity doesn't exist, or it doesn't have the component, `World.get` returns `undefined`, similarly to `World.remove`.

Finally, we get to the main highlight of *μECS* - iteration:
```ts
world.view(A, B, C).each((entity, a, b, c) => {
    // do something with the entity and components
});
```
Iteration works by creating a `View` into the `World`. You pass a callback to `View.each`, which iterates over all entities matching the criteria, and calls the callback with each entity and the combination of components you queried for.

It's possible to halt the iteration early by returning `false` from the callback:
```ts
class Test { constructor(value) { this.value = value } }
const world = new World;
for (let i = 0; i < 100; ++i) world.create(new Test(i));
let count = 0;
world.view(Test).each((entity, test) => {
    if (test.value === 50) {
        return false;
    }
    count += 1;
});
console.log(count); // logs "50", even though we have 100 entities
```

A `View` is lazy, which means that it fetches the entity and component data only just before it's passed into the callback. While it's safe to emplace or remove components from the entity inside the callback body, be careful about creating new entities.

For example, if you create an entity with the same archetype as the one you're currently iterating over, it will be fetched at a later time, possibly causing an infinite loop!
```ts
class Test { }
const world = new World;
world.create(new Test);
world.view(Test).each((entity, test) => {
    world.create(new Test);
});
```
If you try to run the above example, it will freeze your tab.

Views utilize TypeScript variadic tuple types, so the types inside the callback are properly known:
```ts
class Test {
    value = "test"
}
class Position {
    x = 0
    y = 0
}
class Discombobulator {
    discom = () => console.log("bobulate");
}

world.view(Test, Position, Discombobulator).each((entity, test, pos, db) => {
    entity;     // type: `number`
    test;       // type: `Test`
    test.value; // type: `string`
    pos;        // type: `Position`
    pos.x;      // type: `number`
    db.discom;  // type: `() => void`
});
```

### Tags

This library also provides a simple tagging mechanism. Tags are empty, unique components that can be used to attach additional ID info to entitites:
```ts
import { World, Tag } from "uecs";

class Position {
    x = 0
    y = 0
}

const world = new World;
for (let i = 0; i < 50; ++i) {
    world.create(new Position, Tag.for("Team A"));
}
for (let i = 0; i < 50; ++i) {
    world.create(new Position, Tag.for("Team B"));
}

world.view(Position, Tag.for("Team A")).each((entity, position) => { /* ... */ });
world.view(Position, Tag.for("Team B")).each((entity, position) => { /* ... */ });
```
They are passed into the callback just like the rest of the components:
```ts
world.view(Position, Tag.for("Team A")).each((entity, position, tag) => {
    console.log(tag); // not undefined, but useless
})
```
The reasoning for this behavior is to simplify the code and improve performance: Treating tags in a special way would slow down the whole code base, increase memory usage, make the library larger, and so on, with minimal benefit. You should put tags last in the `World.view` argument list, as that allows you to easily ignore them.

### That's it!

Congratulations, you've now seen the entire API! Try it out, see if you like it. If you don't, [open an issue](https://github.com/jprochazk/uecs/issues), and let me know what could be improved, if some important functionality is missing, or if anything is broken.

### Documentation

You can look at the [auto-generated documentation](./generated) to quickly find full examples of each part of the API.

You can also take a look at the [demo](./simple-ai), which contains:
* An AI system, making entities wander around, while avoiding walls.
* A collision detection system, ensuring you can't walk off the screen.
* A simple top-down movement system, with which you can control the player.
* A rendering system, making sure you can see what's going on. It uses the browser Canvas2D API.
