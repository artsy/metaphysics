import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

const MIN_MY_COLLECTION_ARTWORKS_COUNT = 3

const MyCollectionOnboardingModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageMyCollectionOnboardingModule",
  fields: {
    showMyCollectionCard: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: async (_root, _options, { collectionLoader, meLoader }) => {
        if (!collectionLoader || !meLoader) {
          return false
        }

        return meLoader().then((me) => {
          return collectionLoader("my-collection", {
            user_id: me.id,
            private: true,
          }).then((res) => {
            return !(res.artworks_count > MIN_MY_COLLECTION_ARTWORKS_COUNT)
          })
        })
      },
    },
    showSWACard: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: async (_root, _options, { collectionLoader, meLoader }) => {
        if (!collectionLoader || !meLoader) {
          return false
        }

        return meLoader().then((me) => {
          return collectionLoader("my-collection", {
            user_id: me.id,
            private: true,
          }).then((res) => {
            return !(res.artworks_count > MIN_MY_COLLECTION_ARTWORKS_COUNT)
          })
        })
      },
    },
  },
})

const HomePageMyCollectionOnboardingModule = {
  type: MyCollectionOnboardingModuleType,
  resolve: (_root, obj) => obj,
}

export default HomePageMyCollectionOnboardingModule
