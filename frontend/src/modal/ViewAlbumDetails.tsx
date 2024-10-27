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
	IonIcon,
	IonPopover,
} from "@ionic/react"
import { cloudOfflineOutline, openOutline } from "ionicons/icons"
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

				<IonButtons slot="end">
					{!album.image_base64 && (
						<>
							<IonButton id="not-downloaded-notice" color="dark">
								<IonIcon slot="icon-only" icon={cloudOfflineOutline} />
							</IonButton>
							<IonPopover trigger="not-downloaded-notice" triggerAction="click">
								<IonContent class="ion-padding">
									Image and additional details are still being collected, please reload a few hours
									later.
								</IonContent>
							</IonPopover>
						</>
					)}
					<IonButton href={`https://www.discogs.com/release/${album.id}`} target="_blank">
						<IonIcon slot="icon-only" icon={openOutline} />
					</IonButton>
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
				<IonItem>
					<IonLabel>
						<h2>Barcode</h2>
						<p>{album.barcode ?? ""}&nbsp;</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
)

export default ViewAlbumDetails
