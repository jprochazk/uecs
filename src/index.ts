export type Constructor<T, Args extends any[] = any> = {
    new(...args: Args): T
}
export type InstanceTypeTuple<T extends any[]> = {
    [K in keyof T]: T[K] extends Constructor<infer U> ? U : never;
};

/**
 * An opaque identifier used to access component arrays
 */
export type Entity = number;

/**
 * Stores arbitrary data
 */
export type Component = {
    free?: () => void;
    [x: string]: any;
    [x: number]: any;
}

export const Null: Entity = -1 >>> 0;

interface TypeStorage<T> { [key: string]: T };
interface ComponentStorage<T> { [key: number]: T };

type ComponentView<T extends Constructor<Component>[]> = (registry: Registry, callback: (entity: Entity, ...components: InstanceTypeTuple<T>) => void) => void;

/**
 * A view is a non-owning container for components.
 * 
 * It is used to efficiently iterate over large 
 */
export class View<T extends Constructor<Component>[]> {
    constructor(private registry: Registry, private view: ComponentView<T>) { }

    each(callback: (entity: Entity, ...components: InstanceTypeTuple<T>) => void) {
        this.view(this.registry, callback);
    }
}

const TagCache: { [id: string]: Constructor<any> } = {};
export interface Tag<Name extends string> {
    /**
     * Don't use this, it doesn't actually exist.
     * It's only here as a "phantom" to preserve
     * the type parameter.
     */
    _NamePhantom: Name;
}
/**
 * This can be used to mark an entity with a unique
 * component type used for identification.
 * 
 * Example:
 * ```
 *  class Position { x = 0; y = 0; };
 *  class Velocity { x = 0; y = 0; };
 *  const registry = new Registry();
 *  const enemy = registry.create(Tag.create("Enemy"));
 *  const player = registry.create(Tag.create("Player"));
 * ```
 */
export function Tag<Name extends string>(name: Name): Constructor<Tag<Name>> {
    let tag = TagCache[name]
    if (tag == null) {
        tag = Object.defineProperty(class { }, "name", { value: name });
        TagCache[name] = tag;
    }
    return tag;
}

/**
 * Registry holds all components in arrays
 *
 * Components are plain JS classes.
 */
export class Registry {
    private entitySequence: Entity = 0;
    private entities: Set<Entity> = new Set;
    private components: TypeStorage<ComponentStorage<Component>> = {};
    private groups: { [id: string]: View<any> } = {};

    /**
     * Creates an entity from provided components (if any)
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
     * Returns true if `entity` is in the registry
     */
    alive(entity: Entity): boolean {
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
     *  const registry = new Registry();
     *  const entity = registry.create();
     *  registry.emplace(entity, new A);
     *  registry.destroy(entity); // logs "A freed"
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
     * Example:
     * ```
     *  const registry = new Registry();
     *  const entity = registry.create();
     *  registry.emplace(entity, new Component);
     *  // ...
     *  const component = registry.get(entity, Component);
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
     * Used to check if `entity` has instance of `component`.
     * 
     * Example:
     * ```
     *  const registry = new Registry();
     *  const entity = registry.create();
     *  registry.has(entity, Component); // false
     *  registry.emplace(entity, new Component);
     *  registry.has(entity, Component); // true
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
     * **Warning:** Overwrites any existing instance of the component!
     * Use `has` to check for existence first, if this is undesirable.
     * 
     * Example:
     * ```
     *  const entity = registry.create();
     *  registry.emplace(new Component, entity);
     * ```
     */
    emplace<T extends Component>(entity: Entity, component: T) {
        const type = component.constructor.name;

        if (!this.entities.has(entity)) {
            throw new Error(`Cannot set component "${type}" for dead entity ID ${entity}`);
        }

        const storage = this.components[type];
        if (storage == null) this.components[type] = {};
        this.components[type][entity] = component;
    }

    /**
     * Removes instance of `component` from `entity`. Also returns the removed component.
     * 
     * Example:
     * ```
     *  const registry = new Registry();
     *  const entity = registry.create();
     *  registry.emplace(entity, new Component);
     *  // ...
     *  registry.remove(entity, Component); // true
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
     * Returns the size of the registry (how many entities are stored)
     */
    size(): number {
        return this.entities.size;
    }

    /**
     * Returns the ID part of the Entity
     */
    static id(entity: Entity): number {
        return entity & 0b00000000_00000000_11111111_11111111
    }
    /**
     * Returns the version part of the Entity
     */
    static version(entity: Entity): number {
        return entity & 0b11111111_11111111_00000000_00000000
    }

    view<T extends Constructor<Component>[]>(...types: T): View<T> {
        let id = "";
        for (let i = 0; i < types.length; ++i) {
            id += types[i].name;
        }
        if (this.groups[id] == null) {
            this.groups[id] = new View(this, generateView(types));
        }
        return this.groups[id];
    }
}

function join(arr: string[], sep: string) {
    let out = "";
    let end = arr.length - 1;
    for (let i = 0; i < end; ++i) {
        out += arr[i] + sep
    }
    out += arr[end]
    return out
}

function generateView(types: any[]): ComponentView<any> {
    // note: prefix _$ is used to lower the chance of name collisions

    let variables = "";
    const varNames: string[] = [];
    for (let i = 0; i < types.length; ++i) {
        const typeName = types[i].name;
        const varName = `${typeName}${i}`;
        varNames.push(varName);
        variables += `var ${varName} = _$registry.components["${typeName}"][entity];\n`;
        variables += `if (${varName} == null) continue nextEntity;\n`;
    }

    let fn = "";
    fn += "nextEntity: for(var entity of _$registry.entities.values()) {\n";
    fn += `${variables}`;
    fn += `_$callback(entity,${join(varNames, ",")});\n`
    fn += "}";

    return new Function("_$registry", "_$callback", fn) as any;
}