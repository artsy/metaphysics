import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  generateSecuredApiKey,
  SecuredApiKeyRestrictions,
} from "@algolia/client-search"
import config from "config"

export const AlgoliaType = new GraphQLObjectType<any, ResolverContext>({
  name: "Algolia",
  fields: () => ({
    apiKey: {
      type: GraphQLString,
      resolve: async (_root, _options, { meLoader }, _info) => {
        const baseOptions = {
          restrictIndices: config.ALGOLIA_RESTRICT_INDICES,
          validUntil: Math.floor(Date.now() / 1000) + 3600, // valid for 1 hour
        }

        if (meLoader) {
          const me = await meLoader()
          const options: SecuredApiKeyRestrictions = {
            ...baseOptions,
            userToken: me._id,
          }

          return generateSecuredApiKey()(
            config.ALGOLIA_SEARCH_API_KEY!,
            options
          )
        } else {
          return generateSecuredApiKey()(
            config.ALGOLIA_SEARCH_API_KEY!,
            baseOptions
          )
        }
      },
    },
  }),
})

const Algolia: GraphQLFieldConfig<void, ResolverContext> = {
  type: AlgoliaType,
  resolve: (_root, _options, _context, _info) => {
    return {}
  },
}

export default Algolia
