import { Record, String, Static } from "runtypes"

export const CulturalMaker = Record({
  _id: String,
  id: String,
  name: String,
  full_name: String,
  created_at: String,
  updated_at: String,
})

export type CulturalMaker = Static<typeof CulturalMaker>
