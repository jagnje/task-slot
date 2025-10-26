import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

const isDev = process.env.ROLLUP_WATCH === "true";

export default {
  input: "src/main.ts",
  output: {
    file: "public/bundle.js",
    format: "iife",
    sourcemap: true,
    name: "GameBundle"
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    isDev && serve({
      open: true,
      contentBase: "public",
      port: 8080
    }),
    isDev && livereload("public")
  ]
};
