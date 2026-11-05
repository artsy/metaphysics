import { Record, String, Static, Null, Boolean, Literal } from "runtypes"

export const OrderedSet = Record({
  id: String,
  _id: String,
  published: Boolean,
  key: String,
  name: String.Or(Null),
  internal_name: String.Or(Null),
  description: String.Or(Null),
  item_type: Literal("Artist")
    .Or(Literal("Artwork"))
    .Or(Literal("FeaturedLink"))
    .Or(Literal("Gene"))
    .Or(Literal("OrderedSet"))
    .Or(Literal("PartnerShow"))
    .Or(Literal("Profile"))
    .Or(Literal("Sale"))
    .Or(Literal("User"))
    .Or(Literal("Video")),
  owner_type: Literal("Fair")
    .Or(Literal("Feature"))
    .Or(Literal("Post"))
    .Or(Null),
  layout: Literal("default").Or(Literal("full")),
  display_on_desktop: Boolean,
  display_on_mobile: Boolean,
  display_on_martsy: Boolean,
  created_at: String,
  updated_at: String,
})

export type OrderedSet = Static<typeof OrderedSet>
