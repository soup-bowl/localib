import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonContent,
	IonItem,
	IonLabel,
	IonList,
} from "@ionic/react"
import { IReleases } from "../api"

interface DisplayProps {
	album: IReleases
	open: boolean
	onClose: () => void
}

const ViewAlbumDetails: React.FC<DisplayProps> = ({ album, open, onClose }) => (
	<IonModal isOpen={open}>
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton onClick={() => onClose()}>Close</IonButton>
				</IonButtons>
				<IonTitle>{album.basic_information.title}</IonTitle>
			</IonToolbar>
		</IonHeader>
		<IonContent className="ion-padding">
			<div style={{ display: "flex", justifyContent: "center" }}>
				<img src={album.image_base64 ? album.image_base64 : album.basic_information.thumb} alt="" />
			</div>
			<IonList inset>
				<IonItem>
					<IonLabel>
						<h2>Title</h2>
						<p>{album.basic_information.title}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Artist</h2>
						<p>{album.basic_information.artists.map((artist) => artist.name).join(", ")}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Genre</h2>
						<p>{album.basic_information.genres.map((genre) => genre).join(", ")}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Label</h2>
						<p>{album.basic_information.labels.map((label) => label.name).join(", ")}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Owned Formats</h2>
						<p>
							{album.basic_information.formats
								.map((format) => `${format.name} (${format.qty})`)
								.join(", ")}
						</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
)

export default ViewAlbumDetails
