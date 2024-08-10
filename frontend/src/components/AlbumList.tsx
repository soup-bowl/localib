import { IonAvatar, IonChip, IonIcon, IonItem, IonLabel, IonList, IonText } from "@ionic/react"
import { disc } from "ionicons/icons"
import { useQuery } from "@tanstack/react-query"
import { IReleases, IVinylResponse, postVinylQueue } from "../api"
import { findLocalImageById } from "../utils"
import "./AlbumList.css"

interface Props {
	data: IReleases[]
	username?: string
	type: "collection" | "want"
	onClickAlbum: (album: IReleases) => void
}

const AlbumList: React.FC<Props> = ({ data, username = "", type, onClickAlbum }) => {
	const imageData = useQuery<IVinylResponse | undefined>({
		queryKey: [`${username}${type}images`],
		queryFn: () => postVinylQueue(data?.map((item) => item.basic_information.id) ?? []),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
		enabled: data !== undefined,
	})

	return (
		<IonList lines="full">
			{data.map((album, index) => {
				let image = undefined
				if (imageData.data) {
					image = findLocalImageById(imageData.data?.available, album.basic_information.id)
				}

				return (
					<IonItem key={index} className="album-list-item" onClick={() => onClickAlbum(album)}>
						<IonAvatar aria-hidden="true" slot="start">
							<img alt="" src={image ? image : album.basic_information.thumb} />
						</IonAvatar>
						<IonLabel>
							<strong>{album.basic_information.title}</strong>
							<br />
							<IonText>{album.basic_information.artists.map((artist) => artist.name).join(", ")}</IonText>
						</IonLabel>
						<IonChip slot="end">
							<IonIcon icon={disc} />
							<IonLabel>{album.basic_information.formats[0].name}</IonLabel>
						</IonChip>
					</IonItem>
				)
			})}
		</IonList>
	)
}

export default AlbumList
