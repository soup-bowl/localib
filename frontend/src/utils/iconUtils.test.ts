import { describe, expect, it } from "vitest"
import {
	filterOutline,
	filterSharp,
	gridOutline,
	gridSharp,
	listOutline,
	listSharp,
	personOutline,
	personSharp,
	pricetagOutline,
	pricetagSharp,
	timeOutline,
	timeSharp,
} from "ionicons/icons"
import { getFilterIcon, getLayoutIcon } from "./iconUtils"

describe("iconUtils", () => {
	it("returns filter icons by filter and platform", () => {
		expect(getFilterIcon("label", "ios")).toBe(pricetagOutline)
		expect(getFilterIcon("artist", "md")).toBe(personSharp)
		expect(getFilterIcon("release", "ios")).toBe(timeOutline)
		expect(getFilterIcon("none", "md")).toBe(filterSharp)
		expect(getFilterIcon("unknown", "ios")).toBe(filterOutline)
	})

	it("returns layout icons by layout and platform", () => {
		expect(getLayoutIcon("list", "ios")).toBe(listOutline)
		expect(getLayoutIcon("list", "md")).toBe(listSharp)
		expect(getLayoutIcon("grid", "ios")).toBe(gridOutline)
		expect(getLayoutIcon("unknown", "md")).toBe(gridSharp)
	})
})
