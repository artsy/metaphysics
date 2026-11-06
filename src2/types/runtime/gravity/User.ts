import { Record, String, Static } from "runtypes"

export const User = Record({
  id: String,
  // TODO
})

export type User = Static<typeof User>
