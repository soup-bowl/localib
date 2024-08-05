import { useRef, useState } from "react"
import { IonCol, IonGrid, IonRow, IonText } from "@ionic/react"
import { IReleases } from "../api"
import { splitRecordsByArtist, splitRecordsByLabel, splitRecordsByYear } from "../utils"
import { useIndexedDBImages } from "../hooks"
import "./AlbumGrid.css"

interface AlbumProps {
	album: IReleases
	index: number
	onClickAlbum: (album: IReleases) => void
}

const AlbumGridEntry: React.FC<AlbumProps> = ({ album, index, onClickAlbum }) => {
	const { getImage, saveImage } = useIndexedDBImages()
	const [displayedImage, setDisplayedImage] = useState<string | undefined>(undefined)
	const imageRef = useRef<HTMLImageElement>(null);

	const handleGetImage = async () => {
		const base64Image = await getImage(`${album.id}`)
		setDisplayedImage(base64Image)
	}
	handleGetImage()

	return (
		<IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
			<div className="album-art-container" onClick={() => onClickAlbum(album)}>
				{displayedImage ? (
					<img src={displayedImage} className="album-art" alt="" />
				) : (
					<img
						src={album.basic_information.thumb}
						className="album-art"
						alt=""
						ref={imageRef}
						onLoad={(e) => {
							if (imageRef.current) {
								const canvas = document.createElement('canvas');
								const ctx = canvas.getContext('2d');
								if (ctx) {
									canvas.width = imageRef.current.width;
									canvas.height = imageRef.current.height;
									ctx.drawImage(imageRef.current, 0, 0);
									const dataURL = canvas.toDataURL('image/jpeg');
									console.log("HOTDOG", dataURL);
								}
							}
						}}
					/>
				)}
			</div>
			<strong style={{ margin: 0 }}>{album.basic_information.title}</strong>
			<br />
			<IonText>{album.basic_information.artists.map((artist) => artist.name).join(", ")}</IonText>
		</IonCol>
	)
}

interface CollectionProps {
	data: IReleases[]
	sort?: "release" | "label" | "artist" | "none"
	onClickAlbum: (album: IReleases) => void
}

const AlbumGrid: React.FC<CollectionProps> = ({ data, sort = "none", onClickAlbum }) => {
	let displayData: [string, IReleases[]][] = []
	let labelText = ""

	switch (sort) {
		default:
		case "none":
			displayData = [["", data]]
			break
		case "release":
			displayData = splitRecordsByYear(data)
			labelText = "Collected in "
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
							{options[1].map((album, index) => (
								<AlbumGridEntry key={index} album={album} index={index} onClickAlbum={onClickAlbum} />
							))}
						</IonRow>
					</IonGrid>
				</div>
			))}
		</>
	)
}

export default AlbumGrid
