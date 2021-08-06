import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import algoliasearch from "algoliasearch"
import config from "config"

export const AlgoliaType = new GraphQLObjectType<any, ResolverContext>({
  name: "Algolia",
  fields: () => ({
    apiKey: {
      type: GraphQLString,
      resolve: ({ userID }) => {
        const client = algoliasearch(
          config.ALGOLIA_APP_ID!,
          config.ALGOLIA_ADMIN_API_KEY!
        )

        // generate a public API key that is valid for 1 hour
        const options = {
          restrictIndices: config.ALGOLIA_RESTRICT_INDICES,
          validUntil: Math.floor(Date.now() / 1000) + 3600,
          userToken: userID,
        }

        return client.generateSecuredApiKey(
          config.ALGOLIA_SEARCH_API_KEY!,
          options
        )
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
