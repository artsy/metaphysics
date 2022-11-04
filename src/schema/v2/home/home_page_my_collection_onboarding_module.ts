import { GraphQLBoolean, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

const MyCollectionOnboardingModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OnboardingModule",
  fields: {
    showMyCollectionCard: {
      type: GraphQLBoolean,
      resolve: async ({ id }, _options, context) => {
        if (!context.collectionLoader) {
          return null
        }
        console.log("id id id ======= ", id)

        const collectionResponse = await context.collectionLoader(
          "my-collection",
          {
            user_id: "61928a867fb62d000ec819e0",
            private: true,
          }
        )
        console.log("collectionResponse ======= ", collectionResponse)

        return collectionResponse.artworks_count > 3
      },
    },
    showSWACard: {
      type: GraphQLBoolean,
      resolve: async ({ id }, _options, context) => {
        if (!context.collectionLoader) {
          return null
        }
        console.log("id id id ======= ", id)

        const collectionResponse = await context.collectionLoader(
          "my-collection",
          {
            user_id: "61928a867fb62d000ec819e0",
            private: true,
          }
        )
        console.log("collectionResponse ======= ", collectionResponse)

        return collectionResponse.artworks_count > 3
      },
    },
  },
})

const HomePageMyCollectionOnboardingModule = {
  type: MyCollectionOnboardingModuleType,
  resolve: (_root, obj) => obj,
}

export default HomePageMyCollectionOnboardingModule
