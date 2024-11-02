import { IonCol, IonGrid, IonIcon, IonRow, IonText } from "@ionic/react"
import { IStatDisplay } from "@/types"
import "./StatDisplay.css"

interface Props {
	items: IStatDisplay[]
}

const StatDisplay: React.FC<Props> = ({ items }) => (
	<IonGrid>
		<IonRow>
			{items.map((stat, index) => (
				<IonCol key={index} className="statdisp-text">
					<IonIcon icon={stat.icon} style={{ fontSize: "48px", color: "#3880ff" }} />
					<IonText style={{ textAlign: "center" }}>
						<h2 style={{ margin: 4 }}>{stat.value ?? "N/A"}</h2>
						<p style={{ margin: 0 }}>{stat.label}</p>
					</IonText>
				</IonCol>
			))}
		</IonRow>
	</IonGrid>
)

export default StatDisplay
