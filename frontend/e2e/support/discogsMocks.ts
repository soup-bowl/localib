import { Page } from "@playwright/test"

type MockRelease = {
	id: number
	instance_id: number
	title: string
	artist: string
	year: number
	date_added: string
	barcode: string
}

const createRelease = (mockRelease: MockRelease) => ({
	id: mockRelease.id,
	instance_id: mockRelease.instance_id,
	folder_id: 1,
	date_added: mockRelease.date_added,
	rating: 0,
	basic_information: {
		id: mockRelease.id,
		master_id: mockRelease.id,
		resource_url: `https://example.com/releases/${mockRelease.id}`,
		thumb: "/album-placeholder.png",
		cover_image: "/album-placeholder.png",
		title: mockRelease.title,
		year: mockRelease.year,
		formats: [{ name: "Vinyl", qty: "1", descriptions: ["LP"] }],
		artists: [
			{
				id: mockRelease.id,
				resource_url: `https://example.com/artists/${mockRelease.id}`,
				name: mockRelease.artist,
				anv: "",
				join: "",
				role: "",
				tracks: "",
			},
		],
		labels: [
			{
				id: mockRelease.id,
				resource_url: `https://example.com/labels/${mockRelease.id}`,
				name: "Blue Note",
				catno: "BN-001",
				entity_type: "1",
				entity_type_name: "Label",
			},
		],
		genres: ["Jazz"],
		styles: ["Modal"],
	},
	vinyl: {
		recordID: mockRelease.id,
		image: "",
		imageHigh: "",
		barcode: mockRelease.barcode,
	},
})

const mockCollectionReleases = [
	createRelease({
		id: 101,
		instance_id: 1001,
		title: "Kind Of Blue",
		artist: "Miles Davis",
		year: 1959,
		date_added: "2024-01-10T00:00:00.000Z",
		barcode: "111111",
	}),
	createRelease({
		id: 102,
		instance_id: 1002,
		title: "A Love Supreme",
		artist: "John Coltrane",
		year: 1965,
		date_added: "2024-02-10T00:00:00.000Z",
		barcode: "222222",
	}),
]

const mockWantedReleases = [
	createRelease({
		id: 201,
		instance_id: 2001,
		title: "The Black Saint and the Sinner Lady",
		artist: "Charles Mingus",
		year: 1963,
		date_added: "2024-03-10T00:00:00.000Z",
		barcode: "333333",
	}),
]

const pageInfo = {
	page: 1,
	pages: 1,
	per_page: 100,
	items: 1,
	urls: {},
}

export const mockDiscogsCollectionApi = async (page: Page) => {
	await page.route("**/api/Discogs/collections?**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				pagination: {
					...pageInfo,
					items: mockCollectionReleases.length,
				},
				releases: mockCollectionReleases,
			}),
		})
	})

	await page.route("**/api/Discogs/wants?**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				pagination: {
					...pageInfo,
					items: mockWantedReleases.length,
				},
				wants: mockWantedReleases,
			}),
		})
	})
}
