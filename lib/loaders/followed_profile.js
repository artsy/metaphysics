import DataLoader from "dataloader"
import gravity from "../apis/gravity"
import { toKey } from "../helpers"
import { map, find, extend, first } from "lodash"

const followedProfileLoader = new DataLoader(
  keys => {
    const keyObjs = map(keys, JSON.parse)
    const { accessToken } = first(keyObjs)
    const ids = map(keyObjs, "id")
    const path = toKey("me/follow/profiles", {
      profiles: ids,
    })
    return gravity(path, accessToken).then(({ body }) => {
      const parsedResults = map(ids, id => {
        const match = find(body, follow => follow.profile.id === id)
        if (match) return extend(match.profile, { is_followed: true })
        return { id, is_followed: false }
      })
      return parsedResults
    })
  },
  { batch: true, cache: false }
)

export default followedProfileLoader
