import {
	ICollections,
	IIdentify,
	IWants,
	IProfile,
	IRelease,
	IReleases,
	IReleaseSet,
	OAuthInput,
	OAuthResponse,
	OAuthTokens,
} from "./interface"

const VINYL_URL = import.meta.env.VITE_VINYL_API_URL

interface Credentials {
	accessToken: string
	secretToken: string
}

/**
 * Performs a GET against the Localib API, optionally authenticated, and returns the parsed JSON body.
 */
const apiGet = async <T>(
	path: string,
	params?: Record<string, string>,
	credentials?: Credentials,
	errorMessage = "Discogs API responded with an unexpected error."
): Promise<T> => {
	const query = params ? `?${new URLSearchParams(params).toString()}` : ""
	const headers: Record<string, string> = { "Content-Type": "application/json" }
	if (credentials) {
		headers.Authorization = `Bearer ${credentials.accessToken}&${credentials.secretToken}`
	}

	const response = await fetch(`${VINYL_URL}/api/${path}${query}`, { headers })
	if (!response.ok) {
		throw new Error(errorMessage)
	}
	return response.json()
}

const LOCALIB_ERROR = "Localib API responded with an unexpected error."

export const getStartToken = (): Promise<OAuthResponse> => apiGet("Auth/Token", undefined, undefined, LOCALIB_ERROR)

export const getAccessToken = (input: OAuthInput): Promise<OAuthTokens> =>
	apiGet(
		"Auth/Callback",
		{
			OauthToken: input.oauthToken,
			OauthSecret: input.oauthSecret,
			OauthVerifier: input.oauthVerifier,
		},
		undefined,
		LOCALIB_ERROR
	)

export const getMe = (accessToken: string, secretToken: string): Promise<IIdentify> =>
	apiGet("Discogs/Identify", undefined, { accessToken, secretToken })

export const getProfile = (username: string, accessToken: string, secretToken: string): Promise<IProfile> =>
	apiGet("Discogs/Profile", { Username: username }, { accessToken, secretToken })

export const getReleaseInfo = (accessToken: string, secretToken: string, id: number): Promise<IRelease> =>
	apiGet("Discogs/Release", { Id: id.toString() }, { accessToken, secretToken })

/**
 * Moves the Localib-specific `vinyl` data onto the release. Image is left undefined (not blank) when Localib
 * hasn't collected it yet, so callers can fall back to the Discogs thumbnail.
 */
const enrichRelease = (release: IReleases, imageQuality: boolean): IReleases => ({
	...release,
	image_base64: release.vinyl
		? (imageQuality ? release.vinyl.imageHigh : release.vinyl.image) || undefined
		: undefined,
	barcode: release.vinyl?.barcode ?? "",
	vinyl: undefined,
})

/**
 * Fetches the user's collection and wantlist (in parallel), following pagination, and enriches each release
 * with image and barcode information.
 */
export const getCollectionAndWants = async (
	username: string,
	accessToken: string,
	secretToken: string,
	imageQuality: boolean,
	onProgress?: (page: number, pages: number) => void
): Promise<IReleaseSet> => {
	const fetchReleases = async (releaseType: "collection" | "want"): Promise<IReleases[]> => {
		const allReleases: IReleases[] = []
		let page = 1

		for (;;) {
			const data = await apiGet<ICollections | IWants>(
				`Discogs/${releaseType}s`,
				{ Username: username, Type: releaseType, Page: page.toString(), PerPage: "100" },
				{ accessToken, secretToken }
			)

			const releases = ("wants" in data ? data.wants : data.releases) ?? []
			for (const release of releases) {
				allReleases.push(enrichRelease(release, imageQuality))
			}

			onProgress?.(data.pagination.page, data.pagination.pages)

			// ">=" rather than "===" so an empty list (pages: 0) can't loop forever.
			if (data.pagination.page >= data.pagination.pages) {
				break
			}
			page += 1
		}

		return allReleases
	}

	const [wants, collection] = await Promise.all([fetchReleases("want"), fetchReleases("collection")])

	return { collection, wants }
}
