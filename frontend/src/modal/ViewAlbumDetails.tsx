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
	IonNote,
} from "@ionic/react"
import { cloudOfflineOutline, openOutline } from "ionicons/icons"
import { useQuery } from "@tanstack/react-query"
import { getReleaseInfo, IRelease, IReleases } from "@/api"
import { useAuth, useDeviceTheme } from "@/hooks"
import { ThemeItemGroup } from "@/components"
import { getAlbumImage, hasLocalImage, joinArtists } from "@/utils"

type TabSet = "info" | "tracks" | "credits" | "notes"

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

const InfoItem: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
	<IonItem>
		<IonLabel>
			<h2>{heading}</h2>
			<p>{children}</p>
		</IonLabel>
	</IonItem>
)

const AlbumDetails: React.FC<{ album: IReleases; onClose: () => void }> = ({ album, onClose }) => {
	const [{ accessToken, secretToken }] = useAuth()
	const { isIos26 } = useDeviceTheme()
	const [tabState, setTabState] = useState<TabSet>("info")

	// Tokens are deliberately left out of the query key - they don't change what data is returned.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const { data, isSuccess } = useQuery<IRelease>({
		queryKey: ["release", album.id],
		queryFn: () => getReleaseInfo(accessToken ?? "", secretToken ?? "", album.id),
		staleTime: ONE_MONTH,
		refetchOnWindowFocus: false,
	})

	const info = album.basic_information

	return (
		<>
			<IonHeader translucent={isIos26}>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={onClose}>Close</IonButton>
					</IonButtons>

					<IonButtons slot="end">
						{!hasLocalImage(album) && (
							<>
								<IonButton id="not-downloaded-notice" color="dark">
									<IonIcon slot="icon-only" icon={cloudOfflineOutline} />
								</IonButton>
								<IonPopover trigger="not-downloaded-notice" triggerAction="click">
									<IonContent className="ion-padding">
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

					<IonTitle>{info.title}</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div style={{ display: "flex", justifyContent: "center", marginBottom: 15 }}>
					<img src={getAlbumImage(album)} alt="" />
				</div>
				<IonSegment
					value={tabState}
					onIonChange={(e) => setTabState((e.detail.value as TabSet | undefined) ?? "info")}
					disabled={!isSuccess}
				>
					<IonSegmentButton value="info">
						<IonLabel>Info</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="tracks">
						<IonLabel>Tracks</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="credits">
						<IonLabel>Credits</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="notes">
						<IonLabel>Notes</IonLabel>
					</IonSegmentButton>
				</IonSegment>
				{tabState === "info" && (
					<>
						<IonList inset>
							<ThemeItemGroup>
								<InfoItem heading="Title">{info.title}</InfoItem>
								<InfoItem heading="Artist">{joinArtists(album)}</InfoItem>
								<InfoItem heading="Genre">{info.genres.join(", ")}</InfoItem>
								<InfoItem heading="Label">{info.labels.map((label) => label.name).join(", ")}</InfoItem>
								<InfoItem heading="Styles">{info.styles.join(", ")}</InfoItem>
								<InfoItem heading="Owned Formats">
									{info.formats.map((format) => `${format.name} (${format.qty})`).join(", ")}
								</InfoItem>
								<InfoItem heading="Barcode">{album.barcode ?? ""}&nbsp;</InfoItem>
							</ThemeItemGroup>
						</IonList>
						{isSuccess && (
							<IonList inset>
								<ThemeItemGroup>
									<InfoItem heading="Released">
										{data.released_formatted} {data.country}
									</InfoItem>
									<InfoItem heading="Community">
										{data.community.have.toLocaleString()} have,{" "}
										{data.community.want.toLocaleString()} want
									</InfoItem>
									<InfoItem heading="Rating">
										{data.community.rating.average}/5 of{" "}
										{data.community.rating.count.toLocaleString()} ratings
									</InfoItem>
								</ThemeItemGroup>
							</IonList>
						)}
					</>
				)}

				{isSuccess && tabState === "tracks" && (
					<IonList inset>
						<ThemeItemGroup>
							{data.tracklist.map((track) => (
								<IonItem key={`${track.position}${track.title}`}>
									<IonNote slot="start">{track.position}</IonNote>
									<IonLabel>{track.title}</IonLabel>
									<IonNote slot="end">{track.duration}</IonNote>
								</IonItem>
							))}
						</ThemeItemGroup>
					</IonList>
				)}
				{isSuccess && tabState === "credits" && (
					<IonList inset>
						<ThemeItemGroup>
							{data.extraartists ? (
								// Only option to use i here - all items in the object can be duplicated.
								data.extraartists.map((artist, i) => (
									<InfoItem key={i} heading={artist.name}>
										{artist.role}
									</InfoItem>
								))
							) : (
								<IonItem>
									<IonLabel color="medium">No information found</IonLabel>
								</IonItem>
							)}
						</ThemeItemGroup>
					</IonList>
				)}
				{isSuccess && tabState === "notes" && (
					<>
						<IonList inset>
							<ThemeItemGroup>
								<IonItem>
									<IonLabel>
										{(data.notes ?? "").split("\n").map((line, i) => (
											<div key={i}>
												{line}
												<br />
											</div>
										))}
									</IonLabel>
								</IonItem>
							</ThemeItemGroup>
						</IonList>
						<IonList inset>
							<ThemeItemGroup>
								{data.identifiers.map((id) => (
									<InfoItem
										key={`${id.type}${id.value}${id.description}`}
										heading={`${id.type} ${id.description ?? ""}`}
									>
										{id.value}
									</InfoItem>
								))}
							</ThemeItemGroup>
						</IonList>
					</>
				)}
			</IonContent>
		</>
	)
}

interface DisplayProps {
	album: IReleases | undefined
	open: boolean
	/** Requests the modal to close (it will animate out). */
	onClose: () => void
	/** Called once the modal has fully closed, including when swiped away. */
	onDidDismiss: () => void
}

/**
 * Stays mounted so Ionic can animate it open and closed. The album content is keyed by release, so tab state
 * resets whenever a different album is shown.
 */
const ViewAlbumDetails: React.FC<DisplayProps> = ({ album, open, onClose, onDidDismiss }) => (
	<IonModal isOpen={open} onDidDismiss={onDidDismiss}>
		{album && <AlbumDetails key={album.instance_id} album={album} onClose={onClose} />}
	</IonModal>
)

export default ViewAlbumDetails
