import { IReleases } from "@/api"
import { IReleasesSort, IReleaseTuple } from "@/types"

export const splitRecordsByYear = (records: IReleases[]): IReleaseTuple => {
	const recordsByYear = records.reduce<IReleasesSort>((acc, record) => {
		const year = new Date(record.date_added).getFullYear().toString()
		if (!acc[year]) {
			acc[year] = []
		}
		acc[year].push(record)
		return acc
	}, {})

	for (const year in recordsByYear) {
		recordsByYear[year].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
	}

	return Object.entries(recordsByYear).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
}

export const splitRecordsByArtist = (records: IReleases[]): IReleaseTuple => {
	const recordsByArtist = records.reduce<IReleasesSort>((acc, record) => {
		const artists = record.basic_information.artists.map((artist) => artist.name)
		artists.forEach((artist) => {
			if (!acc[artist]) {
				acc[artist] = []
			}

			const alreadyExists = acc[artist].some((existing) => existing.id === record.id)
			if (!alreadyExists) {
				acc[artist].push(record)
			}
		})
		return acc
	}, {})

	return Object.entries(recordsByArtist).sort((a, b) => a[0].localeCompare(b[0]))
}

export const splitRecordsByLabel = (records: IReleases[]): IReleaseTuple => {
	const recordsByLabel = records.reduce<IReleasesSort>((acc, record) => {
		const labels = record.basic_information.labels.map((label) => label.name)
		labels.forEach((label) => {
			if (!acc[label]) {
				acc[label] = []
			}

			const alreadyExists = acc[label].some((existing) => existing.id === record.id)
			if (!alreadyExists) {
				acc[label].push(record)
			}
		})
		return acc
	}, {})

	return Object.entries(recordsByLabel).sort((a, b) => a[0].localeCompare(b[0]))
}

export const masterSort = (sort: "release" | "label" | "artist" | "none", records: IReleases[]): IReleaseTuple => {
	switch (sort) {
		default:
		case "none":
			return [["", records]]
		case "release":
			return splitRecordsByYear(records)
		case "label":
			return splitRecordsByLabel(records)
		case "artist":
			return splitRecordsByArtist(records)
	}
}
