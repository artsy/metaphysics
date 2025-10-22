import {
  Array,
  Record,
  Number,
  String,
  Boolean,
  Null,
  Undefined,
  Static,
  Literal,
} from "runtypes"

export const Feature = Record({
  _id: String,
  id: String,
  name: String,
  description: String.Or(Null),
  subheadline: String.Or(Null),
  callout: String.Or(Null),
  layout: Literal("default").Or(Literal("full")),
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
  meta_title: String.Or(Null).Or(Undefined),
  video_url: String.Or(Null).Or(Undefined),
})

export type Feature = Static<typeof Feature>
