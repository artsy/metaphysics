import { ResolverContext } from "types/graphql"
import artnetDataManagers from "lib/apis/artnetDataManagers"

// See resolver-specs/artnet/_Query.md
export default {
  Query: {
    publicArtworkListings: async (
      _root: unknown,
      { freeformTextQuery, filters, page, pageSize }: Record<string, any>,
      { artnetEnv }: ResolverContext
    ) => {
      // TODO: `filters` is passed through as-is until the Artnet filter format
      // is settled.
      const { body } = await artnetDataManagers(
        artnetEnv(),
        "coredata/v2/artwork-listings/search",
        {
          method: "POST",
          body: { freeformTextQuery, filters, page, pageSize },
        }
      )
      return body
    },
  },
}
