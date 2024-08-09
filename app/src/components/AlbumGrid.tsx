import { IonCol, IonGrid, IonRow, IonText } from "@ionic/react"
import { IAvailableItem, IReleases, IVinylResponse, postVinylQueue } from "../api"
import { splitRecordsByArtist, splitRecordsByLabel, splitRecordsByYear } from "../utils"
import "./AlbumGrid.css"
import { useQuery } from "@tanstack/react-query"

interface AlbumProps {
	album: IReleases
	staticImage?: string
	index: number
	onClickAlbum: (album: IReleases) => void
}

const AlbumGridEntry: React.FC<AlbumProps> = ({ album, index, staticImage = undefined, onClickAlbum }) => {
	return (
		<IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
			<div className="album-art-container" onClick={() => onClickAlbum(album)}>
				<img src={staticImage ? staticImage : album.basic_information.thumb} className="album-art" alt="" />
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
	username?: string
	onClickAlbum: (album: IReleases) => void
}

const AlbumGrid: React.FC<CollectionProps> = ({ data, sort = "none", username = "", onClickAlbum }) => {
	const imageData = useQuery<IVinylResponse>({
		queryKey: [`${username}images`],
		queryFn: () => postVinylQueue(data?.map((item) => item.basic_information.id) ?? []),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
		enabled: data !== undefined,
	})

	const findLocalImageById = (available: IAvailableItem[], id: number): string | undefined => {
		const item = available.find((item) => item.recordID === id)
		return item ? item.image : undefined
	}

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

	if (imageData.isLoading) {
		return <></>
	}

	return (
		<>
			{displayData.map((options, index) => (
				<div key={index} className="album-art-div">
					<h2>{labelText + options[0]}</h2>
					<IonGrid>
						<IonRow>
							{options[1].map((album, index) => {
								let image = undefined
								if (imageData.data) {
									image = findLocalImageById(imageData.data?.available, album.basic_information.id)
								}

								return (
									<AlbumGridEntry
										key={index}
										album={album}
										staticImage={image}
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
