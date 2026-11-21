import { ReactNode } from "react"
import { IonItemGroup } from "@ionic/react"
import { deviceMode } from "@/theme/deviceTheme"

const ThemeItemGroup: React.FC<{ children: ReactNode }> = ({ children }) => {
	// The theme is fixed until reload, so use the cached value rather than re-reading localStorage each render.
	if (deviceMode !== "ios26") {
		return <>{children}</>
	}

	return <IonItemGroup>{children}</IonItemGroup>
}

export default ThemeItemGroup
