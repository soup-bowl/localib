import { useRef, useState } from "react"
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSelect,
	IonSelectOption,
	IonTitle,
	IonToolbar,
	RefresherEventDetail,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading, AlbumGrid } from "../components"
import "./Collection.css"

interface DisplayProps {
	album: IReleases
	open: boolean
	onClose: () => void
}

const CollectionDisplayModal: React.FC<DisplayProps> = ({ album, open, onClose }) => {
	console.log("Selected Album", album)

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
				<img src={album.basic_information.thumb} />
				<IonItem>
					<IonLabel>
						<h2>Title</h2>
						<p>{album.basic_information.title}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Artist</h2>
						<p>{album.basic_information.artists.map(artist => artist.name).join(', ')}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Genre</h2>
						<p>{album.basic_information.genres.map(genre => genre).join(', ')}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Label</h2>
						<p>{album.basic_information.labels.map(label => label.name).join(', ')}</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>Owned Formats</h2>
						<p>{album.basic_information.formats.map(format => `${format.name} (${format.qty})`).join(', ')}</p>
					</IonLabel>
				</IonItem>
			</IonContent>
		</IonModal>
	)
}

const CollectionPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })
	const [sort, setSort] = useState<"artists" | "albums" | "labels">("albums")

	const { data, isLoading } = useQuery<IReleases[]>({
		queryKey: ["collection"],
		queryFn: () => getCollectionReleases((page, pages) => setLoading({ page: page, pages: pages })),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await queryClient.invalidateQueries({ queryKey: ["collection"] })
		event.detail.complete()
	}

	if (data) {
		console.log("Collection Data", data)
	}

	if (isLoading) {
		return (
			<IonPage>
				<FullpageLoading loadingProgress={loading.page + 1} loadingComplete={loading.pages} />
			</IonPage>
		)
	}

	return (
		<IonPage>
			<div className="fancy-header">
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>
							<IonList>
								<IonItem>
									<IonSelect
										aria-label="SortType"
										interface="popover"
										value={sort}
										onChange={(e) => setSort(e.currentTarget.value)}
									>
										<IonSelectOption value="artists">Artists</IonSelectOption>
										<IonSelectOption value="albums">Albums</IonSelectOption>
										<IonSelectOption value="labels">Labels</IonSelectOption>
									</IonSelect>
								</IonItem>
							</IonList>
						</IonTitle>
					</IonToolbar>
				</IonHeader>
			</div>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				{data && (
					<AlbumGrid
						data={data}
						onClickAlbum={(album) => setModalInfo(album)}
					/>
				)}

				{modalInfo && (
					<CollectionDisplayModal
						album={modalInfo}
						open={typeof modalInfo !== undefined}
						onClose={() => setModalInfo(undefined)}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}

export default CollectionPage
