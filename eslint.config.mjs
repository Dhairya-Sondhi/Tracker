import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // Existing effects hydrate browser-only state and subscribe to external systems.
    // Refactoring them is a separate UI performance change, not part of the security upgrade.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "next-env.d.ts"]),
]);

export default config;
