import {
  Array,
  Record,
  Number,
  String,
  Boolean,
  Null,
  Undefined,
  Static,
} from "runtypes"

export const Feature = Record({
  _id: String,
  id: String,
  name: String,
  description: String.Or(Null),
  subheadline: String.Or(Null),
  callout: String.Or(Null),
  active: Boolean,
  original_width: Number.Or(Null),
  original_height: Number.Or(Null),
  image_versions: Array(String),
  image_urls: Record({
    square: String.Or(Undefined),
    large_rectangle: String.Or(Undefined),
    wide: String.Or(Undefined),
    source: String.Or(Undefined),
  }).Or(Null),
  created_at: String,
})

export type Feature = Static<typeof Feature>
