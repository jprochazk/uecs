
import { InstanceTypeTuple, Constructor, join } from "./util";

/**
 * An opaque identifier used to access component arrays
 */
export type Entity = number;

/**
 * The Null entity can be used to initialiaze a variable
 * which is meant to hold an entity without actually using `null`.
 */
export const Null: Entity = -1 >>> 0;

/**
 * Stores arbitrary data
 */
export interface Component {
    free?: () => void;
    [x: string]: any;
    [x: number]: any;
}

// Type aliases for component storage
interface TypeStorage<T> { [type: string]: T }
interface ComponentStorage<T> { [entity: number]: T }

/**
 * World is the core of the ECS. 
 * It stores all entities and their components,
 * and enables efficiently querying them.
 */
export class World {
    private entitySequence: Entity = 0;
    private entities: Set<Entity> = new Set;
    private components: TypeStorage<ComponentStorage<Component>> = {};
    private views: { [id: string]: View<any> } = {};

    /**
     * Creates an entity, and optionally assigns all `components` to it.
     */
    create<T extends Component[]>(...components: T): Entity {
        const entity = this.entitySequence++;
        this.entities.add(entity);

        // emplace all components into entity
        for (let i = 0, len = components.length; i < len; ++i) {
            this.emplace(entity, components[i]);
        }

        return entity;
    }

    /**
     * Inserts the `entity`, and optionally assigns all `components` to it.
     * 
     * @throws If `entity` already exists.
     */
    insert<T extends Component[]>(entity: Entity, ...components: T): Entity {
        if (this.entities.has(entity)) {
            throw new Error(`Attempted to insert duplicate entity ${entity}`);
        }
        this.entities.add(entity);
        for (let i = 0, len = components.length; i < len; ++i) {
            this.emplace(entity, components[i]);
        }
        return entity;
    }

    /**
     * Returns true if `entity` exists in this World
     */
    exists(entity: Entity): boolean {
        return this.entities.has(entity);
    }

    /**
     * Destroys an entity and all its components
     * 
     * Calls `.free()` (if available) on each destroyed component
     * 
     * Example:
     * ```
     *  class A { free() { console.log("A freed"); } }
     *  const world = new World();
     *  const entity = world.create(new A);
     *  world.destroy(entity); // logs "A freed"
     * ```
     */
    destroy(entity: Entity) {
        this.entities.delete(entity);
        for (const storage of Object.values(this.components)) {
            const component = storage[entity];
            if (component !== undefined && component.free !== undefined) component.free();
            delete storage[entity];
        }
    }


    /**
     * Retrieves component of type `type` for `entity`
     * 
     * @throws If `entity` does not exist
     * 
     * Example:
     * ```
     *  class A { value = 50 }
     *  const world = new World();
     *  const entity = world.create();
     *  world.emplace(entity, new A);
     *  world.get(entity, A).value; // 50
     *  world.get(entity, A).value = 10;
     *  world.get(entity, A).value; // 10
     * ```
     */
    get<T extends Component>(entity: Entity, component: Constructor<T>): T | undefined {
        const type = component.name;
        // can't get for "dead" entity
        if (!this.entities.has(entity)) {
            throw new Error(`Cannot get component "${type}" for dead entity ID ${entity}`);
        }

        const storage = this.components[type];
        if (storage === undefined) return undefined;
        return storage[entity] as T | undefined;
    }

    /**
     * Returns `true` if `entity` has `component`, `false` otherwise.
     * 
     * Example:
     * ```
     *  class A {}
     *  const world = new World();
     *  const entity = world.create();
     *  world.has(entity, A); // false
     *  world.emplace(entity, new A);
     *  world.has(entity, A); // true
     * ```
     */
    has<T extends Component>(entity: Entity, component: Constructor<T>): boolean {
        const type = component.name;
        const storage = this.components[type];
        return storage !== undefined && storage[entity] !== undefined;
    }

    /**
     * Sets `entity`'s instance of component `type` to `component`.
     * 
     * @throws If `entity` does not exist
     * 
     * **Warning:** Overwrites any existing instance of the component!
     * This is to avoid an unnecessary check in 99% of cases where the
     * entity does not have the component yet. Use `world.has` to 
     * check for the existence of the component first, if this is undesirable.
     * 
     * Example:
     * ```
     *  class A {}
     *  const entity = world.create();
     *  world.emplace(entity, new A);
     * ```
     */
    emplace<T extends Component>(entity: Entity, component: T) {
        const type = component.name ?? component.constructor.name;

        if (!this.entities.has(entity)) {
            throw new Error(`Cannot set component "${type}" for dead entity ID ${entity}`);
        }

        const storage = this.components[type];
        if (storage == null) this.components[type] = {};
        this.components[type][entity] = component;
    }

    /**
     * Removes instance of `component` from `entity`, and returns the removed component,
     * or `undefined` if nothing was removed.
     * 
     * @throws If `entity` does not exist
     * 
     * Example:
     * ```
     *  class A { value = 10 }
     *  const world = new World();
     *  const entity = world.create();
     *  world.emplace(entity, new A);
     *  world.get(entity, A).value = 50
     *  world.remove(entity, A); // A { value: 50 }
     *  world.remove(entity, A); // undefined
     * ```
     * 
     * This does **not** call `.free()` on the component. The reason for this is that
     * you don't always want to free the removed component. You can still free component,
     * because the `World.remove` method returns it! Example:
     * ```
     *  class F { free() { console.log("freed") } }
     *  const world = new World;
     *  const entity = world.create(new F);
     *  world.remove(entity, F).free();
     *  // you can use optional chaining to easily guard against the 'undefined' case:
     *  world.remove(entity, F)?.free();
     * ```
     */
    remove<T extends Component>(entity: Entity, component: Constructor<T>): T | undefined {
        const type = component.name;

        // can't remove for "dead" entity
        if (!this.entities.has(entity)) {
            throw new Error(`Cannot remove component "${type}" for dead entity ID ${entity}`);
        }

        const storage = this.components[type];
        if (storage == null) return undefined;
        const out = this.components[type][entity] as T | undefined;
        delete this.components[type][entity];
        return out;
    }

    /**
     * Returns the size of the world (how many entities are stored)
     */
    size(): number {
        return this.entities.size;
    }

    /**
     * Used to query for entities with specific components
     * and efficiently iterate over the result.
     * 
     * A view is a non-owning container for components.
     * It has a `.each` method, which accepts a callback.
     * The callback is called with each entity in the view,
     * and the queried components belonging to the entity.
     * 
     * Example:
     * ```
     *  class A {}
     *  class B {}
     *  class C {}
     *  const world = new World();
     * 
     *  for (let i = 0; i < 100; ++i) {
     *      if (i % 3 === 0 && i % 5 === 0) world.create(new A, new B, new C)
     *      else if (i % 3 === 0) world.create(new A, new B);
     *      else if (i % 5 === 0) world.create(new B, new C);
     *  }
     * 
     *  world.view(A, B, C).each((n) => {
     *      console.log(`${n} => FizzBuzz`);
     *  });
     * ```
     */
    view<T extends Constructor<Component>[]>(...types: T): View<T> {
        let id = "";
        for (let i = 0; i < types.length; ++i) {
            id += types[i].name;
        }
        if (this.views[id] == null) {
            this.views[id] = new View(this, generateView(types));
        }
        return this.views[id];
    }

    /**
     * Removes every entity, and destroys all components.
     */
    clear() {
        for (const entity of this.entities.values()) {
            this.destroy(entity);
        }
    }

    /**
     * Returns an iterator over all the entities in the world.
     */
    all(): IterableIterator<Entity> {
        return this.entities.values();
    }
}

type ViewCallback<T extends Constructor<Component>[]> = (entity: Entity, ...components: InstanceTypeTuple<T>) => false | void;
type ComponentView<T extends Constructor<Component>[]> = (world: World, callback: ViewCallback<T>) => void;
/**
 * A view is a non-owning container for components.
 * 
 * It is used to efficiently iterate over large 
 */
class View<T extends Constructor<Component>[]> {
    constructor(private world: World, private view: ComponentView<T>) { }

    each(callback: ViewCallback<T>) {
        this.view(this.world, callback);
    }
}

function generateView(types: any[]): ComponentView<any> {
    // note: dark arcane arts ahead

    let variables = "";
    const varNames: string[] = [];
    for (let i = 0; i < types.length; ++i) {
        const typeName = types[i].name;
        const varName = `${typeName}${i}`;
        varNames.push(varName);
        // note: prefix _$ is used to lower the chance of name collisions
        variables += `var ${varName} = _$world.components["${typeName}"][entity];\n`;
        variables += `if (${varName} === undefined) continue;\n`;
    }

    let fn = "";
    fn += "for(var entity of _$world.entities.values()) {\n";
    fn += `${variables}`;
    fn += `if (_$callback(entity,${join(varNames, ",")}) === false) return;\n`
    fn += "}";

    return new Function("_$world", "_$callback", fn) as any;
}