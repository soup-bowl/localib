import { deviceMode, toIonicMode } from "@/theme/deviceTheme"

const ionicMode = toIonicMode(deviceMode)

/**
 * The device theme is fixed for the lifetime of the app (changing it requires a reload), so these values are
 * computed once at module load.
 */
const theme = {
	deviceMode,
	ionicMode,
	/** Whether headers should be translucent (iOS 26 theme only). */
	isIos26: deviceMode === "ios26",
	/** Item colour used by the settings lists - "light" on the iOS themes. */
	itemColor: ionicMode === "ios" ? ("light" as const) : undefined,
}

const useDeviceTheme = () => theme

export default useDeviceTheme
