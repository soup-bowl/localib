/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest"
import { getDeviceMode, toIonicMode } from "./deviceTheme"

describe("deviceTheme", () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it("falls back to ios when DeviceTheme is missing", () => {
		expect(getDeviceMode()).toBe("ios")
	})

	it("returns stored ios, ios26, and md values", () => {
		localStorage.setItem("DeviceTheme", JSON.stringify("ios"))
		expect(getDeviceMode()).toBe("ios")

		localStorage.setItem("DeviceTheme", JSON.stringify("ios26"))
		expect(getDeviceMode()).toBe("ios26")

		localStorage.setItem("DeviceTheme", JSON.stringify("md"))
		expect(getDeviceMode()).toBe("md")
	})

	it("falls back to ios for invalid or unparsable values", () => {
		localStorage.setItem("DeviceTheme", JSON.stringify("android"))
		expect(getDeviceMode()).toBe("ios")

		localStorage.setItem("DeviceTheme", "not-json")
		expect(getDeviceMode()).toBe("ios")
	})

	it("maps device modes to Ionic modes", () => {
		expect(toIonicMode("ios")).toBe("ios")
		expect(toIonicMode("ios26")).toBe("ios")
		expect(toIonicMode("md")).toBe("md")
	})
})
