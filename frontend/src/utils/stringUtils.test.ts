import { describe, expect, it } from "vitest"
import { formatBytes, formatCurrency, isNullOrBlank } from "./stringUtils"

describe("stringUtils", () => {
	it("formats bytes with units", () => {
		expect(formatBytes(0)).toBe("0 Bytes")
		expect(formatBytes(1024)).toBe("1 KB")
		expect(formatBytes(1536, 1)).toBe("1.5 KB")
	})

	it("detects null and blank strings", () => {
		expect(isNullOrBlank(undefined)).toBe(true)
		expect(isNullOrBlank(null)).toBe(true)
		expect(isNullOrBlank("   ")).toBe(true)
		expect(isNullOrBlank("value")).toBe(false)
	})

	it("formats currency for known and unknown symbols", () => {
		expect(formatCurrency(12.5, "usd")).toBe("$12.50")
		expect(formatCurrency(8, "gbp")).toBe("£8.00")
		expect(formatCurrency(3.25, "unknown")).toBe("?3.25")
	})
})
