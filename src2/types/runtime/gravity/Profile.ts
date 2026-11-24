import { Record, String, Static } from "runtypes"

export const Profile = Record({
  id: String,
  // TODO
})

export type Profile = Static<typeof Profile>
