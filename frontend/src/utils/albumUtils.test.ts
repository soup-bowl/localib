import { describe, expect, it } from "vitest"
import { IReleases } from "@/api"
import { getAlbumImage, hasLocalImage } from "./albumUtils"

const album = (image_base64?: string) =>
	({ image_base64, basic_information: { thumb: "thumb.jpg" } }) as unknown as IReleases

describe("albumUtils", () => {
	it("falls back to the Discogs thumbnail when no local image exists", () => {
		expect(getAlbumImage(album(undefined))).toBe("thumb.jpg")
		// Older cached data stored a blank string rather than undefined.
		expect(getAlbumImage(album(""))).toBe("thumb.jpg")
		expect(getAlbumImage(album("local.jpg"))).toBe("local.jpg")
	})

	it("reports whether a local image has been collected", () => {
		expect(hasLocalImage(album(undefined))).toBe(false)
		expect(hasLocalImage(album(""))).toBe(false)
		expect(hasLocalImage(album("local.jpg"))).toBe(true)
	})
})
