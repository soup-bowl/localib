import { describe, expect, it } from "vitest"
import { formatBytes } from "./stringUtils"

describe("stringUtils", () => {
	it("formats bytes with units", () => {
		expect(formatBytes(0)).toBe("0 Bytes")
		expect(formatBytes(1024)).toBe("1 KB")
		expect(formatBytes(1536, 1)).toBe("1.5 KB")
	})
})
