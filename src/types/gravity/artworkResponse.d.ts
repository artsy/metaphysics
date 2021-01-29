// This is generated from taking a few Artwork responses from
// Gravity and throwing them into QuickType. You should consider it
// 90% accurate, but not perfect.

// If you want to make it 100% you should look at alloy/gravitype

/// So, that you can write with types against gravity responses
export interface GravityArtwork {
  artist: Artist
  partner: Partner
  images: Image[]
  cultural_makers: any[]
  artists: Artist[]
  _id: string
  id: string
  title: string
  display: string
  manufacturer: null
  category: string
  medium: string
  unique: boolean
  forsale: boolean
  sold: boolean
  date: string
  dimensions: Dimensions
  price: string
  availability: string
  availability_hidden: boolean
  ecommerce: boolean
  offer: boolean
  collecting_institution: string
  blurb: string
  edition_sets_count: number
  published: boolean
  private: boolean
  price_currency: string
  price_includes_tax: boolean
  sale_message: null | string
  inquireable: boolean
  acquireable: boolean
  offerable: boolean
  offerable_from_inquiry: boolean
  published_at: string
  can_share: boolean
  can_share_image: boolean
  deleted_at: null
  cultural_maker: null
  sale_ids: any[]
  /// https://github.com/artsy/gravity/blob/master/app/models/domain/attribution.rb
  attribution_class:
    | null
    | "editioned multiple"
    | "ephemera"
    | "limited edition"
    | "made-to-order"
    | "non-editioned multiple"
    | "reproduction"
    | "unique"
  cached: number
}

export interface Artist {
  _id: string
  id: string
  sortable_id: string
  name: string
  years: string
  public: boolean
  birthday: string
  consignable: boolean
  deathday: string
  nationality: string
  published_artworks_count: number
  forsale_artworks_count: number
  artworks_count: number
  original_width: null
  original_height: null
  image_url: string
  image_versions: ImageVersion[]
  image_urls: ArtistImageUrls
}

export interface ArtistImageUrls {
  four_thirds: string
  large: string
  square: string
  tall: string
}

export enum ImageVersion {
  FourThirds = "four_thirds",
  Large = "large",
  Square = "square",
  Tall = "tall",
}

export interface Dimensions {
  in: null | string
  cm: null | string
}

export interface Image {
  id: string
  position: number
  aspect_ratio: number
  downloadable: boolean
  original_width: number
  original_height: number

  default?: boolean // Appears in `Image`
  is_default?: boolean //Appears in `AdditionalImage`

  image_url: string
  image_versions: string[]
  image_urls: ImageImageUrls
  tile_size: number
  tile_overlap: number
  tile_format: string
  tile_base_url: null | string
  max_tiled_height: number
  max_tiled_width: number
  gemini_token: string
  gemini_token_updated_at: null | string
}

export interface ImageImageUrls {
  large: string
  large_rectangle: string
  larger?: string
  medium: string
  medium_rectangle: string
  normalized?: string
  small: string
  square: string
  tall: string
}

export interface Partner {
  partner_categories: PartnerCategory[]
  _id: string
  id: string
  default_profile_id: string
  default_profile_public: boolean
  sortable_id: string
  type:
    | "Auction"
    | "Demo"
    | "Gallery"
    | "Private Collector"
    | "Private Dealer"
    | "Institution"
    | "Institutional Seller"
    | "Brand"

  name: string
  short_name: string
  pre_qualify: boolean
  website: string
  has_full_profile: boolean
  has_fair_partnership: boolean
  has_limited_fair_partnership: boolean
  profile_layout: string
  display_works_section: boolean
  profile_banner_display: null | string
  profile_artists_layout: null | string
  display_artists_section: boolean
}

export interface PartnerCategory {
  _id: string
  id: string
  category_type: string
  name: string
  internal: boolean
}
