import { IReleases } from "../api"
import { RecordsByYear } from "../types"

export const splitRecordsByYear = (records: IReleases[]): [string, IReleases[]][] => {
	const recordsByYear = records.reduce<RecordsByYear>((acc, record) => {
		const year = new Date(record.date_added).getFullYear().toString()
		if (!acc[year]) {
			acc[year] = []
		}
		acc[year].push(record)
		return acc
	}, {})

	return Object.entries(recordsByYear).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
}
