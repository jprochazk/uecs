
export type Constructor<T, Args extends any[] = any> = {
    new(...args: Args): T
}

export type InstanceTypeTuple<T extends any[]> = {
    [K in keyof T]: T[K] extends Constructor<infer U> ? U : never;
};

export function join(arr: string[], sep: string) {
    let out = "";
    const end = arr.length - 1;
    for (let i = 0; i < end; ++i) {
        out += arr[i] + sep
    }
    out += arr[end]
    return out
}