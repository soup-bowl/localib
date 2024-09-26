import { IonCol, IonGrid, IonIcon, IonRow, IonText } from "@ionic/react"
import { IReleases } from "../api"
import { splitRecordsByArtist, splitRecordsByLabel, splitRecordsByYear } from "../utils"
import { cloudOfflineOutline } from "ionicons/icons"
import "./AlbumGrid.css"

interface AlbumProps {
	album: IReleases
	index: number
	onClickAlbum: (album: IReleases) => void
}

const AlbumGridEntry: React.FC<AlbumProps> = ({ album, index, onClickAlbum }) => (
	<IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
		<div className="album-art-container" onClick={() => onClickAlbum(album)}>
			<img
				src={album.image_base64 ? album.image_base64 : album.basic_information.thumb}
				className="album-art"
				alt=""
			/>
			{!album.image_base64 && (
				<IonIcon className="nodl" aria-hidden="true" icon={cloudOfflineOutline} size="large" />
			)}
		</div>
		<strong style={{ margin: 0 }}>{album.basic_information.title}</strong>
		<br />
		<IonText>{album.basic_information.artists.map((artist) => artist.name).join(", ")}</IonText>
	</IonCol>
)

interface CollectionProps {
	data: IReleases[]
	sort?: "release" | "label" | "artist" | "none"
	type: "collection" | "want"
	onClickAlbum: (album: IReleases) => void
}

const AlbumGrid: React.FC<CollectionProps> = ({ data, sort = "none", type, onClickAlbum }) => {
	let displayData: [string, IReleases[]][] = []
	let labelText = ""

	switch (sort) {
		default:
		case "none":
			displayData = [["", data]]
			break
		case "release":
			displayData = splitRecordsByYear(data)
			labelText = `${type === "collection" ? "Collected" : "Wanted"} in `
			break
		case "label":
			displayData = splitRecordsByLabel(data)
			break
		case "artist":
			displayData = splitRecordsByArtist(data)
			break
	}

	return (
		<>
			{displayData.map((options, index) => (
				<div key={index} className="album-art-div">
					<h2>{labelText + options[0]}</h2>
					<IonGrid>
						<IonRow>
							{options[1].map((album, index) => {
								return (
									<AlbumGridEntry
										key={index}
										album={album}
										index={index}
										onClickAlbum={onClickAlbum}
									/>
								)
							})}
						</IonRow>
					</IonGrid>
				</div>
			))}
		</>
	)
}

export default AlbumGrid
