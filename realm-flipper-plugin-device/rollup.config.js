import typescript from "rollup-plugin-typescript";

export default {
  input: "./src/RealmPlugin.tsx",
  output: "./dist/index.js",
  plugins: [typescript()],
  external: ["react", "react-dom", "react-native-flipper", "realm"]
};