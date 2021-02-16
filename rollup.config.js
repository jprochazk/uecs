import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default [
    // UMD, CJS, ESM
    {
        input: "src/index.ts",
        plugins: [
            json(),
            typescript({
                typescript: require("typescript"),
            }),
            terser({
                output: {
                    comments: false,
                },
            }),
        ],
        output: [
            { exports: "named", file: pkg.main, format: "cjs" },
            { file: pkg.module, format: "es" },
            { name: "packet", file: pkg.browser, format: "umd" },
        ],
    },
];
