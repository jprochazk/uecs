
import { Constructor } from "./util";

export interface EntityTag<Name extends string> {
    /**
     * Don't try to use this, it only exists to preserve the type parameter.
     */
    __$PHANTOM$: Name & never;
}

export abstract class Tag {
    private static cache: { [id: string]: any } = {};

    /**
     * This can be used to assign an entity a
     * unique component type, for identification
     * purposes.
     * 
     * Example:
     * ```
     *  const registry = new Registry();
     *  // create
     *  const enemy = registry.create(Tag.for("Enemy"));
     *  const player = registry.create(Tag.for("Player"));
     * 
     *  // query
     *  registry.view(Tag.for("Enemy")).each(() => { ... });
     *  registry.view(Tag.for("Player")).each(() => { ... });
     * ```
     */
    static for<Name extends string>(name: Name): Constructor<EntityTag<Name>> {
        let t = Tag.cache[name]
        if (t == null) {
            t = Object.defineProperty(class { }, "name", { value: `T$${name}` });
            Tag.cache[name] = t;
        }
        return t;
    }
}
