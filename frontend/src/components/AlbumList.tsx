import { memo } from "react"
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
import { getAlbumImage, joinArtists } from "@/utils"
import "./AlbumList.css"

// Memoised so that state changes in the parent page don't re-render every album in large collections.
const AlbumListItem: React.FC<{
	album: IReleases
	onClickAlbum: (album: IReleases) => void
}> = memo(({ album, onClickAlbum }) => {
	const format = album.basic_information.formats?.[0]?.name

	return (
		<IonItem className="album-list-item" onClick={() => onClickAlbum(album)}>
			<IonAvatar aria-hidden="true" slot="start">
				<img alt="" src={getAlbumImage(album)} loading="lazy" decoding="async" />
			</IonAvatar>
			<IonLabel>
				<strong>{album.basic_information.title}</strong>
				<br />
				<IonText>{joinArtists(album)}</IonText>
			</IonLabel>
			{format && (
				<IonChip slot="end">
					<IonIcon icon={disc} />
					<IonLabel>{format}</IonLabel>
				</IonChip>
			)}
		</IonItem>
	)
})
AlbumListItem.displayName = "AlbumListItem"

export const AlbumListGroups: React.FC<{
	data: IReleaseTuple
	onClickAlbum: (album: IReleases) => void
}> = ({ data, onClickAlbum }) => (
	<>
		{data.map(([group, albums]) => (
			<IonItemGroup key={group}>
				<IonItemDivider>
					<IonLabel>{group}</IonLabel>
				</IonItemDivider>
				{albums.map((album) => (
					<AlbumListItem key={album.instance_id} album={album} onClickAlbum={onClickAlbum} />
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
		{data.map((album) => (
			<AlbumListItem key={album.instance_id} album={album} onClickAlbum={onClickAlbum} />
		))}
	</IonList>
)
