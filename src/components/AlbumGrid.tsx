import { IonCol, IonGrid, IonRow } from "@ionic/react"
import { IReleases } from "../api"
import "./AlbumGrid.css"

interface Props {
	data: IReleases[]
}

const AlbumGrid: React.FC<Props> = ({ data }) => {
	return (
		<div className="album-art-div">
			<IonGrid>
				<IonRow>
					{data.map((album, index) => (
						<IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
							<div className="album-art-container">
								<img src={album.basic_information.thumb} className="album-art" alt={`Album ${index}`} />
							</div>
						</IonCol>
					))}
				</IonRow>
			</IonGrid>
		</div>
	)
}

export default AlbumGrid
