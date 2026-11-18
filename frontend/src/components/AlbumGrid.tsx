import { memo } from "react"
import { IonCol, IonGrid, IonIcon, IonRow, IonText } from "@ionic/react"
import { cloudOfflineOutline } from "ionicons/icons"
import { IReleases } from "@/api"
import { IReleaseTuple } from "@/types"
import { getAlbumImage, hasLocalImage, joinArtists } from "@/utils"
import "./AlbumGrid.css"

interface AlbumProps {
	album: IReleases
	onClickAlbum: (album: IReleases) => void
}

// Memoised so that state changes in the parent page don't re-render every album in large collections.
const AlbumGridEntry: React.FC<AlbumProps> = memo(({ album, onClickAlbum }) => (
	<IonCol size="6" sizeMd="4" sizeLg="3">
		<div
			className="album-art-container"
			role="button"
			tabIndex={0}
			onClick={() => onClickAlbum(album)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					onClickAlbum(album)
				}
			}}
		>
			<img src={getAlbumImage(album)} className="album-art" alt="" loading="lazy" decoding="async" />
			{!hasLocalImage(album) && (
				<IonIcon className="nodl" aria-hidden="true" icon={cloudOfflineOutline} size="large" />
			)}
		</div>
		<strong style={{ margin: 0 }}>{album.basic_information.title}</strong>
		<br />
		<IonText>{joinArtists(album)}</IonText>
	</IonCol>
))
AlbumGridEntry.displayName = "AlbumGridEntry"

interface CollectionProps {
	data: IReleaseTuple
	onClickAlbum: (album: IReleases) => void
}

const AlbumGrid: React.FC<CollectionProps> = ({ data, onClickAlbum }) => (
	<>
		{data.map(([group, albums]) => (
			<div key={group} className="album-art-div">
				<h2>{group}</h2>
				<IonGrid>
					<IonRow>
						{albums.map((album) => (
							<AlbumGridEntry key={album.instance_id} album={album} onClickAlbum={onClickAlbum} />
						))}
					</IonRow>
				</IonGrid>
			</div>
		))}
	</>
)

export default AlbumGrid
