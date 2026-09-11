// The shapes Gravity's itinerary endpoints return, in snake_case.

export interface GravityItineraryStop {
  id: string
  itinerary_section_id: string
  position: number
  /** Null for a custom stop. */
  item_type: "PartnerShow" | "PartnerLocation" | "Fair" | null
  item_id: string | null
  /** Only on a show or fair stop. */
  event_type: "PartnerShowEvent" | "FairEvent" | null
  event_id: string | null
  /** Overrides the item's name. Required when there is no item. */
  title: string | null
  address: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  start_at: string | null
  end_at: string | null
  /** IANA identifier saying which wall clock start_at/end_at were written against. */
  time_zone: string | null
  note: string | null
  category: string | null
  is_free_admission: boolean | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface GravityItinerarySection {
  id: string
  itinerary_id: string
  title: string | null
  note: string | null
  position: number
  stops_count: number
  stops: GravityItineraryStop[]
  created_at: string
  updated_at: string
}

export interface GravityItinerary {
  id: string
  /** Only a published, curated guide has one. */
  slug: string | null
  user_id: string
  city_slug: string
  title: string
  subtitle: string | null
  description: string | null
  author_name: string | null
  is_curated: boolean
  /** Gravity derives this from published_at and share_token. */
  visibility: "private" | "unlisted" | "public"
  published_at: string | null
  published_by_id: string | null
  share_token: string | null
  sections_count: number
  sections: GravityItinerarySection[]
  /** Templated URL with a `:version` placeholder. */
  image_url: string | null
  /** Version name to URL. Its keys are the available versions. */
  image_urls: Record<string, string> | null
  created_at: string
  updated_at: string
}
