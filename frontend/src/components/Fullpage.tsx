import { IonProgressBar, IonSpinner } from "@ionic/react"
import "./Fullpage.css"

const FullpageLoading: React.FC<{
	loadingProgress?: number
	loadingComplete?: number
}> = ({ loadingProgress = undefined, loadingComplete = undefined }) => {
	const calculateProgress = (progress: number, complete: number): number => {
		return complete === 0 ? 0 : progress / complete
	}

	if (loadingProgress && loadingComplete) {
		return (
			<div className="fullpage-container">
				<IonSpinner />
				<IonProgressBar value={calculateProgress(loadingProgress, loadingComplete)} color="light" />
			</div>
		)
	}

	return (
		<div className="fullpage-container">
			<IonSpinner />
		</div>
	)
}

const FullpageInfo: React.FC<{ text: string }> = ({ text }) => (
	<div className="fullpage-container">
		<p>{text}</p>
	</div>
)

export { FullpageLoading, FullpageInfo }
