import { IonCol, IonGrid, IonRow, IonText } from "@ionic/react"
import { IReleases } from "../api"
import "./AlbumGrid.css"

interface Props {
	data: IReleases[]
	onClickAlbum: (album: IReleases) => void
}

const AlbumGrid: React.FC<Props> = ({ data, onClickAlbum }) => {
	return (
		<div className="album-art-div">
			<IonGrid>
				<IonRow>
					{data.map((album, index) => (
						<IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
							<div className="album-art-container" onClick={() => onClickAlbum(album)}>
								<img src={album.basic_information.thumb} className="album-art" alt={`Album ${index}`} />
							</div>
							<strong style={{ margin: 0 }}>{album.basic_information.title}</strong>
							<br/>
							<IonText>{album.basic_information.artists[0].name}</IonText>
						</IonCol>
					))}
				</IonRow>
			</IonGrid>
		</div>
	)
}

export default AlbumGrid
