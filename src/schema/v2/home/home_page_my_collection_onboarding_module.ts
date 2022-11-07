import { GraphQLBoolean, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

const MyCollectionOnboardingModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageMyCollectionOnboardingModule",
  fields: {
    showMyCollectionCard: {
      type: GraphQLBoolean,
      resolve: async (_root, _options, { collectionLoader, meLoader }) => {
        if (!collectionLoader || !meLoader) {
          return false
        }

        return meLoader().then((me) => {
          return collectionLoader("my-collection", {
            user_id: me.id,
            private: true,
          }).then((res) => {
            return res.artworks_count > 3
          })
        })
      },
    },
    showSWACard: {
      type: GraphQLBoolean,
      resolve: async (_root, _options, { collectionLoader, meLoader }) => {
        if (!collectionLoader || !meLoader) {
          return false
        }

        return meLoader().then((me) => {
          return collectionLoader("my-collection", {
            user_id: me.id,
            private: true,
          }).then((res) => {
            return res.artworks_count > 3
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
