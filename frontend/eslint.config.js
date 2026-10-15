import js from "@eslint/js"
import pluginQuery from "@tanstack/eslint-plugin-query"
import react from "eslint-plugin-react"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
	{ ignores: ["dist", "android", "ios"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	react.configs.flat.recommended,
	react.configs.flat["jsx-runtime"],
	...pluginQuery.configs["flat/recommended"],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
			"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
			// Props are typed with TypeScript instead of prop-types
			"react/prop-types": "off",
		},
	}
)
