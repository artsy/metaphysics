import { Record, Static, String, Number } from "runtypes"

export const VideoType = Record({
  src: String,
  height: Number,
  width: Number,
})

export type Video = Static<typeof VideoType>
