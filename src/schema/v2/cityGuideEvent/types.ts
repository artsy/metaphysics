import { GravityItinerary } from "schema/v2/itinerary/types"

export interface GravityCityGuideEvent {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  city_slug: string
  start_at: string
  end_at: string
  time_zone: string | null
  published_at: string | null
  published_by_id: string | null
  image_url: string | null
  image_urls: Record<string, string> | null
  itineraries: GravityItinerary[]
  created_at: string
  updated_at: string
}
