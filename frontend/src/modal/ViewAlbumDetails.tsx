import { useState } from "react"
import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonIcon,
	IonPopover,
	IonSegment,
	IonSegmentButton,
	SegmentChangeEventDetail,
	IonNote,
} from "@ionic/react"
import { cloudOfflineOutline, openOutline } from "ionicons/icons"
import { useQuery } from "@tanstack/react-query"
import { getReleaseInfo, IRelease, IReleases } from "@/api"
import { useAuth } from "@/hooks"

enum TabSet {
	Info,
	Tracks,
	Credits,
	Notes,
	IDs,
}

interface DisplayProps {
	album: IReleases
	open: boolean
	onClose: () => void
}

const ViewAlbumDetails: React.FC<DisplayProps> = ({ album, open, onClose }) => {
	const [{ accessToken, secretToken }] = useAuth()
	const [tabState, setTabState] = useState<number>(0)

	const { data, isSuccess } = useQuery<IRelease>({
		queryKey: ["release", album.id],
		queryFn: () => getReleaseInfo(accessToken ?? "", secretToken ?? "", album.id),
		staleTime: 1000 * 60 * 60 * 24 * 30, // 1 month
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
	})

	return (
		<IonModal isOpen={open} onDidDismiss={() => onClose()}>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => onClose()}>Close</IonButton>
					</IonButtons>

					<IonButtons slot="end">
						{!album.image_base64 && (
							<>
								<IonButton id="not-downloaded-notice" color="dark">
									<IonIcon slot="icon-only" icon={cloudOfflineOutline} />
								</IonButton>
								<IonPopover trigger="not-downloaded-notice" triggerAction="click">
									<IonContent class="ion-padding">
										Image and additional details are still being collected, please reload a few
										hours later.
									</IonContent>
								</IonPopover>
							</>
						)}
						<IonButton href={`https://www.discogs.com/release/${album.id}`} target="_blank">
							<IonIcon slot="icon-only" icon={openOutline} />
						</IonButton>
					</IonButtons>

					<IonTitle>{album.basic_information.title}</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div style={{ display: "flex", justifyContent: "center", marginBottom: 15 }}>
					<img src={album.image_base64 ? album.image_base64 : album.basic_information.thumb} alt="" />
				</div>
				<IonSegment
					value={tabState}
					onIonChange={(e: CustomEvent<SegmentChangeEventDetail>) => {
						// @ts-expect-error aaa
						setTabState(parseInt(e.detail.value ?? "0"))
					}}
					disabled={!isSuccess}
				>
					<IonSegmentButton value={TabSet.Info}>
						<IonLabel>Info</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value={TabSet.Tracks}>
						<IonLabel>Tracks</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value={TabSet.Credits}>
						<IonLabel>Credits</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value={TabSet.Notes}>
						<IonLabel>Notes</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value={TabSet.IDs}>
						<IonLabel>IDs</IonLabel>
					</IonSegmentButton>
				</IonSegment>
				{tabState === TabSet.Info && (
					<>
						<IonList inset>
							<IonItem>
								<IonLabel>
									<h2>Title</h2>
									<p>{album.basic_information.title}</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Artist</h2>
									<p>{album.basic_information.artists.map((artist) => artist.name).join(", ")}</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Genre</h2>
									<p>{album.basic_information.genres.map((genre) => genre).join(", ")}</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Label</h2>
									<p>{album.basic_information.labels.map((label) => label.name).join(", ")}</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Styles</h2>
									<p>{album.basic_information.styles.map((style) => style).join(", ")}</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Owned Formats</h2>
									<p>
										{album.basic_information.formats
											.map((format) => `${format.name} (${format.qty})`)
											.join(", ")}
									</p>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonLabel>
									<h2>Barcode</h2>
									<p>{album.barcode ?? ""}&nbsp;</p>
								</IonLabel>
							</IonItem>
						</IonList>
						{isSuccess && (
							<IonList inset>
								<IonItem>
									<IonLabel>
										<h2>Released</h2>
										<p>
											{data.released_formatted} {data.country}
										</p>
									</IonLabel>
								</IonItem>
								<IonItem>
									<IonLabel>
										<h2>Community</h2>
										<p>
											{data.community.have.toLocaleString()} have,{" "}
											{data.community.want.toLocaleString()} want
										</p>
									</IonLabel>
								</IonItem>
								<IonItem>
									<IonLabel>
										<h2>Rating</h2>
										<p>
											{data.community.rating.average}/5 of{" "}
											{data.community.rating.count.toLocaleString()} ratings
										</p>
									</IonLabel>
								</IonItem>
							</IonList>
						)}
					</>
				)}

				{isSuccess && tabState === TabSet.Tracks && (
					<IonList inset>
						{data.tracklist.map((track) => (
							<IonItem key={`${track.position}${track.title}`}>
								<IonNote slot="start">{track.position}</IonNote>
								<IonLabel>{track.title}</IonLabel>
								<IonNote slot="end">{track.duration}</IonNote>
							</IonItem>
						))}
					</IonList>
				)}
				{isSuccess && tabState === TabSet.Credits && (
					<IonList inset>
						{data.extraartists ? (
							<>
								{/* Only option to use i here - all items in the object can be duplicated. */}
								{data.extraartists.map((artist, i) => (
									<IonItem key={i}>
										<IonLabel>
											<h2>{artist.name}</h2>
											<p>{artist.role}</p>
										</IonLabel>
									</IonItem>
								))}
							</>
						) : (
							<IonItem>
								<IonLabel color="medium">No information found</IonLabel>
							</IonItem>
						)}
					</IonList>
				)}
				{isSuccess && tabState === TabSet.Notes && (
					<IonList inset>
						<IonItem>
							<IonLabel>
								{data.notes.split("\n").map((line, i) => (
									<div key={i}>
										{line}
										<br />
									</div>
								))}
							</IonLabel>
						</IonItem>
					</IonList>
				)}
				{isSuccess && tabState === TabSet.IDs && (
					<IonList inset>
						{data.identifiers.map((id) => (
							<IonItem key={`${id.type}${id.value}${id.description}`}>
								<IonLabel>
									<h2>
										{id.type} {id.description}
									</h2>
									<p>{id.value}</p>
								</IonLabel>
							</IonItem>
						))}
					</IonList>
				)}
			</IonContent>
		</IonModal>
	)
}

export default ViewAlbumDetails
