import { IReleases } from "@/api"
import { IReleasesSort, IReleaseTuple } from "@/types"

export const splitRecordsByYear = (records: IReleases[]): IReleaseTuple => {
	// Parse each date once up front rather than repeatedly inside the sort comparator.
	const timestamps = new Map(records.map((record) => [record, new Date(record.date_added).getTime()]))

	const recordsByYear = records.reduce<IReleasesSort>((acc, record) => {
		const year = new Date(timestamps.get(record)!).getFullYear().toString()
		acc[year] ??= []
		acc[year].push(record)
		return acc
	}, {})

	for (const year in recordsByYear) {
		recordsByYear[year].sort((a, b) => timestamps.get(b)! - timestamps.get(a)!)
	}

	return Object.entries(recordsByYear).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
}

/**
 * Groups records by every name returned from `getNames`, listing each release at most once per group.
 */
const groupByNames = (records: IReleases[], getNames: (record: IReleases) => string[]): IReleaseTuple => {
	const groups = new Map<string, { ids: Set<number>; records: IReleases[] }>()

	for (const record of records) {
		for (const name of getNames(record)) {
			let group = groups.get(name)
			if (!group) {
				group = { ids: new Set(), records: [] }
				groups.set(name, group)
			}
			if (!group.ids.has(record.id)) {
				group.ids.add(record.id)
				group.records.push(record)
			}
		}
	}

	return Array.from(groups, ([name, group]): [string, IReleases[]] => [name, group.records]).sort((a, b) =>
		a[0].localeCompare(b[0])
	)
}

export const splitRecordsByArtist = (records: IReleases[]): IReleaseTuple =>
	groupByNames(records, (record) => record.basic_information.artists.map((artist) => artist.name))

export const splitRecordsByLabel = (records: IReleases[]): IReleaseTuple =>
	groupByNames(records, (record) => record.basic_information.labels.map((label) => label.name))

export type CollectionSort = "release" | "label" | "artist" | "none"

export const masterSort = (sort: CollectionSort, records: IReleases[]): IReleaseTuple => {
	switch (sort) {
		case "release":
			return splitRecordsByYear(records)
		case "label":
			return splitRecordsByLabel(records)
		case "artist":
			return splitRecordsByArtist(records)
		case "none":
		default:
			return [["", records]]
	}
}
