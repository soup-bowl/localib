import { deviceMode, toIonicMode } from "@/theme/deviceTheme"

const useDeviceTheme = () => ({
	deviceMode,
	ionicMode: toIonicMode(deviceMode),
})

export default useDeviceTheme
