import { IReleases } from "@/api"
import { describe, expect, it } from "vitest"
import { masterSort, splitRecordsByArtist, splitRecordsByLabel, splitRecordsByYear } from "./collectionSort"

const createRelease = (
	id: number,
	date: string,
	artists: string[],
	labels: string[]
): IReleases => ({
	id,
	instance_id: id,
	folder_id: 1,
	date_added: new Date(date),
	rating: 0,
	basic_information: {
		id,
		master_id: id,
		resource_url: "",
		thumb: "",
		cover_image: "",
		title: `Release ${id}`,
		year: new Date(date).getFullYear(),
		formats: [],
		artists: artists.map((name, index) => ({
			id: index,
			resource_url: "",
			name,
			anv: "",
			join: "",
			role: "",
			tracks: "",
		})),
		labels: labels.map((name, index) => ({
			id: index,
			resource_url: "",
			name,
			catno: "",
			entity_type: "",
			entity_type_name: "",
		})),
		genres: [],
		styles: [],
	},
})

describe("collectionSort", () => {
	it("splits by year and sorts years and releases descending", () => {
		const releases = [
			createRelease(1, "2024-02-01T00:00:00.000Z", ["A"], ["L1"]),
			createRelease(2, "2023-01-01T00:00:00.000Z", ["B"], ["L2"]),
			createRelease(3, "2024-03-01T00:00:00.000Z", ["C"], ["L3"]),
		]

		const result = splitRecordsByYear(releases)

		expect(result.map(([year]) => year)).toEqual(["2024", "2023"])
		expect(result[0][1].map((release) => release.id)).toEqual([3, 1])
	})

	it("groups artist and label entries without duplicating a release", () => {
		const releases = [createRelease(1, "2024-01-01T00:00:00.000Z", ["Artist A", "Artist A"], ["Label A", "Label A"])]

		const artistGroups = splitRecordsByArtist(releases)
		const labelGroups = splitRecordsByLabel(releases)

		expect(artistGroups).toHaveLength(1)
		expect(artistGroups[0][1]).toHaveLength(1)
		expect(labelGroups).toHaveLength(1)
		expect(labelGroups[0][1]).toHaveLength(1)
	})

	it("returns unsorted records when no sort is selected", () => {
		const releases = [
			createRelease(1, "2024-01-01T00:00:00.000Z", ["A"], ["L1"]),
			createRelease(2, "2024-01-02T00:00:00.000Z", ["B"], ["L2"]),
		]

		expect(masterSort("none", releases)).toEqual([["", releases]])
	})
})
