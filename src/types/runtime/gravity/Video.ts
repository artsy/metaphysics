import { Record, String, Static, Null, Number } from "runtypes"

export const Video = Record({
  _id: String,
  title: String.Or(Null),
  description: String.Or(Null),
  player_embed_url: String.Or(Null),
  width: Number.Or(Null),
  height: Number.Or(Null),
})

export type Video = Static<typeof Video>
