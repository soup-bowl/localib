interface artist {
	id: number
	resource_url: string
	name: string
	anv: string
	join: string
	role: string
	tracks: string
}

interface label {
	id: number
	resource_url: string
	name: string
	catno: string
	entity_type: string
	entity_type_name: string
}

interface format {
	name: string
	qty: string
	descriptions: string[]
}

interface committer {
	username: string
	resource_url: string
}

interface identifiers {
	type: string
	value: string
	description: string
}

interface videos {
	uri: string
	title: string
	description: string
	duration: number
	embed: boolean
}

interface track {
	title: string
	position: string
	type_: string
	duration: string
}

export interface IPagination {
	page: number
	pages: number
	per_page: number
	items: number
	urls: {
		first?: string
		last?: string
		prev?: string
		next?: string
	}
}

export interface IReleases {
	id: number
	instance_id: number
	folder_id: number
	date_added: Date
	rating: number
	basic_information: IReleaseLight
	image_base64?: string
	barcode?: string
}

export interface IReleaseLight {
	id: number
	master_id: number
	master_url?: string
	resource_url: string
	thumb: string
	cover_image: string
	title: string
	year: number
	formats: format[]
	artists: artist[]
	labels: label[]
	genres: string[]
	styles: string[]
}

export interface IRelease extends IReleaseLight {
	status: string
	uri: string
	artists_sort: string
	data_quality: string
	community: {
		have: number
		want: number
		rating: {
			count: number
			average: number
		}
		submitter: committer
		contributors: committer[]
		data_quality: string
		status: string
	}
	format_quantity: number
	date_added: string
	date_changed: string
	num_for_sale: number
	lowest_price: number
	country: string
	released: string
	notes: string
	released_formatted: string
	identifiers: identifiers[]
	videos: videos[]
	tracklist: track[]
	extraartists: artist[]
	estimated_weight: number
	blocked_from_sale: boolean
}

export interface IReleaseSet {
	collection: IReleases[]
	wants: IReleases[]
}

export interface ICollections {
	pagination: IPagination
	releases: IReleases[]
}

export interface IWants {
	pagination: IPagination
	wants: IReleases[]
}

export interface IIdentify {
	id: number
	username: string
	resource_url: string
	consumer_name: string
}

export interface IProfile {
	id: number
	username: string
	name: string
	email: string
	resource_url: string
	inventory_url: string
	collection_folders_url: string
	collection_fields_url: string
	wantlist_url: string
	uri: string
	profile: string
	home_page: string
	location: string
	registered: string
	num_lists: number
	num_for_sale: number
	num_collection: number
	num_wantlist: number
	num_pending: number
	releases_contributed: number
	rank: number
	releases_rated: number
	rating_avg: number
	avatar_url: string
	banner_url: string
}

export interface IAvailableItem {
	recordID: number
	image: string
}

export interface IVinylResponse {
	available: IAvailableItem[]
	queued: number[]
}

export interface VinylAPIImageMap {
	image?: string
	imageHigh?: string
	barcode?: string
}

export interface VinylAPIImageRecord extends VinylAPIImageMap {
	recordID: number
}
