import { IonProgressBar, IonSpinner } from "@ionic/react"
import "./Fullpage.css"

const FullpageLoading: React.FC<{
	loadingProgress?: number
	loadingComplete?: number
}> = ({ loadingProgress = undefined, loadingComplete = undefined }) => (
	<div className="fullpage-container">
		<IonSpinner></IonSpinner>
		{loadingProgress && loadingComplete && (
			<IonProgressBar value={loadingProgress / loadingComplete} color="light" />
		)}
	</div>
)

const FullpageInfo: React.FC<{ text: string }> = ({ text }) => (
	<div className="fullpage-container">
		<p>{text}</p>
	</div>
)

export { FullpageLoading, FullpageInfo }
