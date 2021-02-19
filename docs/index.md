
### World API

The constructor takes no parameters:
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
const entity = 0;
world.destroy(entity);
```
When you destroy an entity, all of its components are destroyed, too. If you component has a `.free()` method, this method will be called:
```ts
class Test { free() { console.log("freed!") } }
const entity = world.create(new Test);
world.destroy(entity); // logs "freed!"
```

You can also insert a specific entity ID:
```ts
const entity = 10;
world.insert(entity);
```
Which is useful for when you're receiving entities from a server, or reading them from a file.

Here is how to check if an entity exists:
```ts
const entity = 10;
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
This is because you are in charge of creating component instances, and passing them to the `World`:
```ts
const component = new MyComponent;
const entity = world.create();
world.emplace(entity, component);
```
This has a number of benefits, such as being able to do your own object pooling, or resource management, without having to depend on this library doing it the *right* way. There are plenty of existing libraries which can do this for you, and this means it's a breeze to integrate them!

The above is quite verbose, and there is a better way:
```ts
const entity = world.create(new MyComponent);
```
`World.create` optionally takes a variable amount or arguments, each being a component instance. When the entity is created, all the components are automatically emplaced onto it.

`World.insert` is consistent with `World.create`, and takes a variable amount of component instances:
```ts
world.insert(entity, new A, new B, new C, ...);
```

Here's how you remove a component:
```ts
world.remove(entity, MyComponent);
```
It accepts the class directly, instead of a string name or component ID, leading to a very concise API!

`World.remove` returns the removed component, as well:
```ts
const component = world.remove(entity, MyComponent);
```
If the entity did not have the component, or if the entity doesn't exist, this returns `undefined`.

You can also check if an entity has a specific component:
```ts
world.has(entity, MyComponent);
```
Similarly to `World.remove`, it accepts the class of the component you're asking about.

Here's how you get a component from an entity:
```ts
const component = world.get(entity, MyComponent);
```
If the entity doesn't exist, or it doesn't have the component, this returns `undefined`, similarly to `World.remove`.

Finally, we get to the real deal - iteration:
```ts
world.view(A, B, C).each((entity, a, b, c) => {
    // do something with the entity and components
});
```
Iteration works by creating a non-owning `View` into the `World`. You pass a callback into `View.each`, which iterates over all entities matching the criteria, and calls the callback with each entity, and combination of components you queried for. Feel free to emplace or remove components from the entity inside the callback body. 

Be careful about creating new entities, though. A `View` is lazy, which means it fetches data only when it needs to. If you create an entity with the same archetype as the one you're currently iterating over, it will appear at some point during the iteration:
```ts
const Test { constructor(value) { this.value = value; } }
const world = new World;
world.create(new Test("A"));
world.view(Test).each((entity, test) => {
    if (test.value === "B") {
        console.log("Found it.");
    }
    
    world.create(new Test("B"));
});
```
The above example will log `"Found it."` into the console.

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

This library also provides a simple tagging mechanism. Tags are empty, unique components, which can be used to give entities additional identification:
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
They are passed into the callback just like the rest of the components, so I recommend always putting tags last in the `World.view` argument list, so you can easily ignore them. The reasoning is again to simplify the code, and improve performance: It's a lot slower to check if something is a tag or not before passing it to the callback.

### That's it!

Now you know the full API! Try it out, see if you like it. If you don't, [submit an issue](https://github.com/jprochazk/uecs/issues), and let me know what could be improved, if some important functionality is missing, or if something is broken.

### Documentation

You can look at the [auto-generated documentation](./generated) to quickly find full examples of each part of the API.

You can also take a look at the [demo](./simple-ai), which contains:
* An AI system, making entities wander around, while avoiding walls.
* Collision detection system, ensuring you can't walk off the screen.
* A simple top-down movement system, with which you can control the player.
* Rendering system, making sure you can see what's going on. It uses the browser Canvas2D API.