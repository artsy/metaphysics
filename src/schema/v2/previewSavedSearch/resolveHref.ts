import { snakeCaseKeys } from "lib/helpers"
import { stringify } from "qs"

export const resolveHref = async (parent, _args, _context, _info) => {
  const primaryArtist = parent.artistIDs?.[0]

  if (!primaryArtist) return null

  // Filter out artistIDs and snake_case the rest of the attributes
  const criteriaAttributesWithoutArtistIds = (({ artistIDs, ...o }) =>
    snakeCaseKeys(o))(parent)
  const queryParams = stringify(criteriaAttributesWithoutArtistIds)

  return `/artist/${primaryArtist}?${queryParams}&for_sale=true`
}
