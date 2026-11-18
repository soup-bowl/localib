import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getCollectionAndWants, IReleaseSet } from "@/api"
import useAuth from "./useAuth"
import useSettings from "./useSettings"

/**
 * Standard-quality data keeps the original key so existing caches carry over; high-quality data gets its own
 * key so toggling the setting triggers a fresh download.
 */
export const collectionQueryKey = (username: string | null, highQuality: boolean) =>
	highQuality ? [`${username}collectionv2`, "hq"] : [`${username}collectionv2`]

const useCollection = (onProgress?: (page: number, pages: number) => void) => {
	const queryClient = useQueryClient()
	const [{ username, accessToken, secretToken }] = useAuth()
	const [imageQuality] = useSettings<boolean>("ImagesAreHQ", false)

	// Tokens are deliberately left out of the query key - they don't change what data is returned.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const query = useQuery<IReleaseSet>({
		queryKey: collectionQueryKey(username, imageQuality),
		queryFn: () =>
			getCollectionAndWants(username ?? "", accessToken ?? "", secretToken ?? "", imageQuality, onProgress),
		staleTime: Infinity,
		enabled: Boolean(username),
	})

	// Once the current quality has loaded, drop the other quality's copy so we don't store the library twice.
	useEffect(() => {
		if (query.isSuccess) {
			queryClient.removeQueries({ queryKey: collectionQueryKey(username, !imageQuality), exact: true })
		}
	}, [query.isSuccess, queryClient, username, imageQuality])

	return query
}

export default useCollection
