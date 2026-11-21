/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react"
import { createRoot } from "react-dom/client"
import { beforeEach, describe, expect, it } from "vitest"
import useSettings from "./useSettings"

// Lets React know this environment supports act().
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe("useSettings", () => {
	beforeEach(() => localStorage.clear())

	it("keeps every component using the same key in sync", () => {
		const setters: ((value: string) => void)[] = []
		const Reader = ({ id }: { id: string }) => {
			const [value, setValue] = useSettings<string>("shared", "default")
			setters.push(setValue)
			return createElement("span", { id }, value)
		}

		const container = document.createElement("div")
		const root = createRoot(container)
		act(() =>
			root.render(
				createElement("div", null, createElement(Reader, { id: "a" }), createElement(Reader, { id: "b" }))
			)
		)
		expect(container.textContent).toBe("defaultdefault")

		act(() => setters[0]("changed"))
		expect(container.textContent).toBe("changedchanged")
		expect(localStorage.getItem("shared")).toBe(JSON.stringify("changed"))

		act(() => root.unmount())
	})
})
