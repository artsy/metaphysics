import { Array, Record, String, Boolean, Null, Static } from "runtypes"
import { PartnerCategory } from "./PartnerCategory"

export const Partner = Record({
  partner_categories: Array(PartnerCategory),
  _id: String,
  id: String,
  default_profile_id: String,
  default_profile_public: Boolean,
  sortable_id: String,
  type: String,
  name: String,
  short_name: String.Or(Null),
  pre_qualify: Boolean,
  website: String,
  has_full_profile: Boolean,
  has_fair_partnership: Boolean,
  profile_layout: String,
  display_works_section: Boolean,
  profile_banner_display: String.Or(Null),
  profile_artists_layout: String.Or(Null),
  display_artists_section: Boolean,
})

export type Partner = Static<typeof Partner>
