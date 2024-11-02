import {
	IonAvatar,
	IonChip,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonListHeader,
	IonText,
} from "@ionic/react"
import { disc } from "ionicons/icons"
import { IReleases } from "@/api"
import { IReleaseTuple } from "@/types"
import "./AlbumList.css"

const AlbumListItem: React.FC<{
	album: IReleases
	onClickAlbum: (album: IReleases) => void
}> = ({ album, onClickAlbum }) => (
	<IonItem className="album-list-item" onClick={() => onClickAlbum(album)}>
		<IonAvatar aria-hidden="true" slot="start">
			<img alt="" src={album.image_base64 ? album.image_base64 : album.basic_information.thumb} />
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

export const AlbumListGroups: React.FC<{
	data: IReleaseTuple
	onClickAlbum: (album: IReleases) => void
}> = ({ data, onClickAlbum }) => (
	<>
		{data.map((options, index) => (
			<IonItemGroup key={index}>
				<IonItemDivider>
					<IonLabel>{options[0]}</IonLabel>
				</IonItemDivider>
				{options[1].map((album, index) => (
					<AlbumListItem key={index} album={album} onClickAlbum={onClickAlbum} />
				))}
			</IonItemGroup>
		))}
	</>
)

export const AlbumList: React.FC<{
	data: IReleases[]
	title?: string
	onClickAlbum: (album: IReleases) => void
}> = ({ data, title = undefined, onClickAlbum }) => (
	<IonList lines="full">
		{title && (
			<IonListHeader>
				<IonLabel>{title}</IonLabel>
			</IonListHeader>
		)}
		{data.map((album, index) => (
			<AlbumListItem key={index} album={album} onClickAlbum={onClickAlbum} />
		))}
	</IonList>
)
