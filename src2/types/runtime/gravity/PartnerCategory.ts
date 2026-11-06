import { Record, String, Boolean, Static } from "runtypes"

export const PartnerCategory = Record({
  _id: String,
  id: String,
  category_type: String,
  name: String,
  internal: Boolean,
})

export type PartnerCategory = Static<typeof PartnerCategory>
