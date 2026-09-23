import { GravityVideo } from "schema/v2/types/Video"

export interface GravityCityArticle {
  id: string
  city_slug: string
  article_id: string
  position: number
  created_at: string
  updated_at: string
}

export interface GravityCityVideo {
  id: string
  city_slug: string
  video_id: string
  video: GravityVideo
  position: number
  created_at: string
  updated_at: string
}
