import DataLoader from "dataloader"
import gravity from "lib/apis/gravity"
import { toKey } from "lib/helpers"
import { map, find, extend, first } from "lodash"

const followedArtistLoader = new DataLoader(
  keys => {
    const keyObjs = map(keys, JSON.parse)
    const { accessToken } = first(keyObjs)
    const ids = map(keyObjs, "id")
    const path = toKey("me/follow/artists", {
      artists: ids,
    })
    return gravity(path, accessToken).then(({ body }) => {
      const parsedResults = map(ids, id => {
        const match = find(body, follow => follow.artist.id === id)
        if (match) return extend(match.artist, { is_followed: true })
        return { id, is_followed: false }
      })
      return parsedResults
    })
  },
  { batch: true, cache: false }
)

export default followedArtistLoader
