import { DeviceMode } from "@/types"
import {
	filterOutline,
	filterSharp,
	pricetagOutline,
	pricetagSharp,
	personOutline,
	personSharp,
	timeOutline,
	timeSharp,
	gridOutline,
	gridSharp,
	listOutline,
	listSharp,
} from "ionicons/icons"

export const getFilterIcon = (filter: string, platform: DeviceMode = "ios") => {
	const isMaterial = platform === "md"
	switch (filter) {
		case "label":
			return isMaterial ? pricetagSharp : pricetagOutline
		case "artist":
			return isMaterial ? personSharp : personOutline
		case "release":
			return isMaterial ? timeSharp : timeOutline
		case "none":
		default:
			return isMaterial ? filterSharp : filterOutline
	}
}

export const getLayoutIcon = (item: string, platform: DeviceMode = "ios") => {
	const isMaterial = platform === "md"
	switch (item) {
		case "list":
			return isMaterial ? listSharp : listOutline
		case "grid":
		default:
			return isMaterial ? gridSharp : gridOutline
	}
}
