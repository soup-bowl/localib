import { useCallback, useState } from "react"
import { IReleases } from "@/api"

/**
 * Keeps the album details modal mounted while it animates closed: `open` flips first, and the album is only
 * cleared once Ionic reports the dismiss animation has finished.
 */
const useAlbumModal = () => {
	const [album, setAlbum] = useState<IReleases | undefined>(undefined)
	const [open, setOpen] = useState<boolean>(false)

	const show = useCallback((selected: IReleases) => {
		setAlbum(selected)
		setOpen(true)
	}, [])
	const close = useCallback(() => setOpen(false), [])
	const dismissed = useCallback(() => {
		setOpen(false)
		setAlbum(undefined)
	}, [])

	return { album, open, show, close, dismissed }
}

export default useAlbumModal
