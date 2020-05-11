import {
  Record,
  String,
  Static,
  Null,
  Boolean,
  Number,
  Array,
  Undefined,
} from "runtypes"

export const FeaturedLink = Record({
  id: String,
  _id: String,
  href: String,
  title: String,
  subtitle: String,
  original_width: Number.Or(Null),
  original_height: Number.Or(Null),
  image_url: String.Or(Null),
  image_versions: Array(String),
  image_urls: Record({
    small_rectangle: String.Or(Undefined),
    large_square: String.Or(Undefined),
    large_rectangle: String.Or(Undefined),
    medium_square: String.Or(Undefined),
    medium_rectangle: String.Or(Undefined),
    small_square: String.Or(Undefined),
    wide: String.Or(Undefined),
  }),
  display_on_desktop: Boolean,
  display_on_mobile: Boolean,
  display_on_martsy: Boolean,
  created_at: String,
  updated_at: String,
})

export type FeaturedLink = Static<typeof FeaturedLink>
