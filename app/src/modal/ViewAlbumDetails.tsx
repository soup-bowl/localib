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
import { useQuery } from "@tanstack/react-query"
import { IReleases, IVinylResponse } from "../api"
import { findLocalImageById } from "../utils"

interface DisplayProps {
	album: IReleases
	username?: string
	open: boolean
	onClose: () => void
}

const ViewAlbumDetails: React.FC<DisplayProps> = ({ album, username = "", open, onClose }) => {
	const imageData = useQuery<IVinylResponse>({
		queryKey: [`${username}images`],
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
		enabled: false,
	})

	let image = undefined
	if (imageData.data) {
		image = findLocalImageById(imageData.data?.available, album.basic_information.id)
	}

	return (
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
					<img src={image ? image : album.basic_information.thumb} alt="" />
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
}

export default ViewAlbumDetails
