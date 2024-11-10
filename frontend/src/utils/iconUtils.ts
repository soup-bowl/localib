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
	switch (filter) {
		case "label":
			return platform === "ios" ? pricetagOutline : pricetagSharp
		case "artist":
			return platform === "ios" ? personOutline : personSharp
		case "release":
			return platform === "ios" ? timeOutline : timeSharp
		case "none":
		default:
			return platform === "ios" ? filterOutline : filterSharp
	}
}

export const getLayoutIcon = (item: string, platform: DeviceMode = "ios") => {
	switch (item) {
		case "list":
			return platform === "ios" ? listOutline : listSharp
		case "grid":
		default:
			return platform === "ios" ? gridOutline : gridSharp
	}
}
