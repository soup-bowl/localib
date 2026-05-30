import { describe, expect, it } from "vitest"
import { getStoragePersistenceMessage } from "./storageUtils"

describe("storageUtils", () => {
	it("returns an unsupported browser message", () => {
		expect(
			getStoragePersistenceMessage({
				supported: false,
				persisted: false,
				canRequest: false,
			})
		).toContain("doesn't support persistent storage")
	})

	it("returns a persisted message", () => {
		expect(
			getStoragePersistenceMessage({
				supported: true,
				persisted: true,
				canRequest: false,
			})
		).toContain("won't be automatically cleared")
	})

	it("returns a request guidance message", () => {
		expect(
			getStoragePersistenceMessage({
				supported: true,
				persisted: false,
				canRequest: true,
			})
		).toContain("add this app to your home screen")
	})
})
