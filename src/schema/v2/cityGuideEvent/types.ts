import { GravityItinerary } from "schema/v2/itinerary/types"

// A join row, not a bare itinerary: carries its own id and position (needed to reorder or
// detach the attachment later) alongside the nested itinerary.
export interface GravityCityGuideEventItinerary {
  id: string
  city_guide_event_id: string
  itinerary_id: string
  position: number
  itinerary: GravityItinerary
  created_at: string
  updated_at: string
}

// A join row (an article attached to a city guide event), not the article itself.
export interface GravityCityGuideEventArticle {
  id: string
  city_guide_event_id: string
  article_id: string
  position: number
  created_at: string
  updated_at: string
}

// Matches Gravity's Video#json_properties (app/models/video.rb) exactly — this is the
// same shape videoLoader/VideoType already consume elsewhere, just embedded here instead
// of fetched separately.
export interface GravityVideo {
  _id: string
  player_embed_url: string
  title: string
  description: string | null
  width: number
  height: number
  aspect_ratio: number | null
  created_at: string
  updated_at: string
}

export interface GravityCityGuideEvent {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  city_slug: string
  start_at: string
  end_at: string
  display_start_at?: string | null
  display_end_at?: string | null
  time_zone: string | null
  published_at: string | null
  published_by_id: string | null
  image_url: string | null
  image_urls: Record<string, string> | null
  // Absent (not just empty) from Gravity's list payload (:short), which hides itineraries
  // to keep listings cheap; present only on the single-record fetch (:public/:all).
  itineraries?: GravityCityGuideEventItinerary[]
  // Present at every tier (:short/:public/:all) — Gravity eager-loads both on every route.
  articles?: GravityCityGuideEventArticle[]
  video?: GravityVideo | null
  created_at: string
  updated_at: string
}
