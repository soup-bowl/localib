import {
	ICollections,
	IIdentify,
	IProfile,
	IRelease,
	IReleases,
	IReleaseSet,
	OAuthInput,
	OAuthResponse,
	OAuthTokens,
} from "./interface"

const VINYL_URL = import.meta.env.VITE_VINYL_API_URL

export const getStartToken = async (): Promise<OAuthResponse> => {
	const response = await fetch(`${VINYL_URL}/api/Auth/Token`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	})
	if (!response.ok) {
		throw new Error("Localib API responded with an unexpected error.")
	}
	return response.json()
}

export const getAccessToken = async (input: OAuthInput): Promise<OAuthTokens> => {
	const response = await fetch(
		`${VINYL_URL}/api/Auth/Callback?OauthToken=${input.oauthToken}&OauthSecret=${input.oauthSecret}&OauthVerifier=${input.oauthVerifier}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		}
	)
	if (!response.ok) {
		throw new Error("Localib API responded with an unexpected error.")
	}
	return response.json()
}

export const getMe = async (password: string, password2: string): Promise<IIdentify> => {
	const response = await fetch(`${VINYL_URL}/api/Discogs/Identify`, {
		headers: {
			Authorization: `Bearer ${password}&${password2}`,
			"Content-Type": "application/json",
		},
	})
	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}
	return response.json()
}

export const getProfile = async (username: string, password: string, password2: string): Promise<IProfile> => {
	const params = new URLSearchParams({
		Username: username,
	})
	const response = await fetch(`${VINYL_URL}/api/Discogs/Profile?${params.toString()}`, {
		headers: {
			Authorization: `Bearer ${password}&${password2}`,
			"Content-Type": "application/json",
		},
	})
	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}
	return response.json()
}

export const getCollectionAndWants = async (
	username: string,
	password: string,
	password2: string,
	imageQuality: boolean,
	onProgress?: (page: number, pages: number) => void
): Promise<IReleaseSet> => {
	/**
	 * Fetches release data for a user, including collection or wantlist, from the Discogs API.
	 * Uses pagination to fetch all pages of data and enriches releases with image and barcode information.
	 *
	 * @param {"collection" | "wants"} releaseType - The type of release data to fetch ("collection" or "want").
	 * @returns {Promise<IReleases[]>} - Array of release data enriched with image and barcode information.
	 * @throws {Error} - Throws an error if the network response is not ok.
	 */
	const fetchReleases = async (releaseType: "collection" | "want"): Promise<IReleases[]> => {
		let allReleases: IReleases[] = []
		let loop: boolean = true
		let page: number = 1

		while (loop) {
			const params = new URLSearchParams({
				Username: username,
				Type: releaseType,
				Page: page.toString(),
				PerPage: "100",
			})
			const response = await fetch(`${VINYL_URL}/api/Discogs/${releaseType}s?${params.toString()}`, {
				headers: {
					Authorization: `Bearer ${password}&${password2}`,
					"Content-Type": "application/json",
				},
			})

			if (!response.ok) {
				throw new Error("Discogs API responded with an unexpected error.")
			}

			const data: ICollections = await response.json()

			if (data.pagination.page === data.pagination.pages) {
				loop = false
			}

			// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
			const parseData: IReleases[] = (releaseType === "want" ? data.wants : data.releases).map(
				(release: IReleases) => {
					const image = () => {
						if (release.vinyl) {
							return imageQuality ? release.vinyl.imageHigh : release.vinyl.image
						}
						return ""
					}

					return {
						...release,
						image_base64: image(),
						barcode: release.vinyl ? release.vinyl.barcode : "",
						vinyl: undefined,
					}
				}
			)

			allReleases = [...allReleases, ...parseData]

			if (onProgress) {
				onProgress(data.pagination.page, data.pagination.pages)
			}

			page += 1
		}

		return allReleases
	}

	// Fetch wants and collection in parallel
	const [wantsReleases, collectionReleases] = await Promise.all([fetchReleases("want"), fetchReleases("collection")])

	return {
		collection: collectionReleases,
		wants: wantsReleases,
	}
}

export const getReleaseInfo = async (password: string, password2: string, id: number): Promise<IRelease> => {
	const params = new URLSearchParams({
		Id: id.toString(),
	})
	const response = await fetch(`${VINYL_URL}/api/Discogs/Release?${params.toString()}`, {
		headers: {
			Authorization: `Bearer ${password}&${password2}`,
			"Content-Type": "application/json",
		},
	})

	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}

	return await response.json()
}
