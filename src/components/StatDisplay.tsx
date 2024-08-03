import { IonCol, IonGrid, IonIcon, IonRow, IonText } from "@ionic/react"
import "./StatDisplay.css"

interface Props {
	items: any
}

const StatDisplay: React.FC<Props> = ({ items }) => {
	return (
		<IonGrid>
			<IonRow>
				{items.map((stat: any, index: any) => (
					<IonCol key={index} className="statdisp-text">
						<IonIcon icon={stat.icon} style={{ fontSize: '48px', color: '#3880ff' }} />
						<IonText style={{ textAlign: 'center' }}>
							<h2 style={{ margin: 4 }}>{stat.value}</h2>
							<p style={{ margin: 0 }}>{stat.label}</p>
						</IonText>
					</IonCol>
				))}
			</IonRow>
		</IonGrid>
	)
}

export default StatDisplay
