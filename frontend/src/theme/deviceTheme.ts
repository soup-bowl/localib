import { DeviceMode } from "@/types"

export const VALID_DEVICE_MODES: DeviceMode[] = ["ios", "ios26", "md"]

export const getDeviceMode = (): DeviceMode => {
	try {
		const item = localStorage.getItem("DeviceTheme")
		const parsedItem = item ? JSON.parse(item) : "ios"
		return VALID_DEVICE_MODES.includes(parsedItem) ? parsedItem : "ios"
	} catch {
		return "ios"
	}
}

export const toIonicMode = (mode: DeviceMode): "ios" | "md" => (mode === "md" ? "md" : "ios")

export const deviceMode = getDeviceMode()
