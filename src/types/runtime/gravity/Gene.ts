import { Record, String, Static } from "runtypes"

export const Gene = Record({
  id: String,
  // TODO
})

export type Gene = Static<typeof Gene>
