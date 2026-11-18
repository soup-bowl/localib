import { IReleases } from "@/api"

/**
 * Returns the best available artwork for a release. Uses `||` rather than `??` so that blank values (as stored
 * by older versions of the app) also fall back to the Discogs thumbnail.
 */
export const getAlbumImage = (album: IReleases): string => album.image_base64 || album.basic_information.thumb

/** Whether Localib has collected its own copy of the artwork yet. */
export const hasLocalImage = (album: IReleases): boolean => Boolean(album.image_base64)

export const joinArtists = (album: IReleases): string =>
	album.basic_information.artists.map((artist) => artist.name).join(", ")
