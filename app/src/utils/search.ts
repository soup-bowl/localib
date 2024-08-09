import { IAvailableItem } from "../api"

export const findLocalImageById = (available: IAvailableItem[], id: number): string | undefined => {
	const item = available.find((item) => item.recordID === id)
	return item ? item.image : undefined
}
