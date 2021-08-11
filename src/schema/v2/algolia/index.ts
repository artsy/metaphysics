import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import algoliasearch from "algoliasearch"
import config from "config"
import { SecuredApiKeyRestrictions } from "@algolia/client-search"

export const AlgoliaType = new GraphQLObjectType<any, ResolverContext>({
  name: "Algolia",
  fields: () => ({
    apiKey: {
      type: GraphQLString,
      resolve: async (_root, _options, { meLoader }, _info) => {
        const client = algoliasearch("unused", "unused")
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

          return client.generateSecuredApiKey(
            config.ALGOLIA_SEARCH_API_KEY!,
            options
          )
        } else {
          return client.generateSecuredApiKey(
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
  resolve: (_root, _options, { userID }, _info) => {
    return { userID }
  },
}

export default Algolia
