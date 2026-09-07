import { ReactNode } from "react"
import { IonItemGroup } from "@ionic/react"
import { getDeviceMode } from "@/theme/deviceTheme"

const ThemeItemGroup: React.FC<{ children: ReactNode }> = ({ children }) => {
	if (getDeviceMode() !== "ios26") {
		return <>{children}</>
	}

	return <IonItemGroup>{children}</IonItemGroup>
}

export default ThemeItemGroup
