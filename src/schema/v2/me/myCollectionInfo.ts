import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { existyValue } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"

interface Response {
  id: string
  image_url: string | null
  image_versions: string[] | null
  name: string | null
  default: boolean
  description: string | null
  private: boolean
  includes_purchased_artworks: boolean
}

export const MyCollectionInfoType = new GraphQLObjectType<
  Response,
  ResolverContext
>({
  name: "MyCollectionInfo",
  fields: () => ({
    ...IDFields,
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => existyValue(image_url),
    },
    imageVersions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ image_versions }) => existyValue(image_versions),
    },
    name: {
      type: GraphQLString,
      resolve: ({ name }) => existyValue(name),
    },
    default: {
      type: GraphQLBoolean,
      resolve: (it) => it.default,
    },
    description: {
      type: GraphQLString,
      resolve: ({ description }) => existyValue(description),
    },
    private: {
      type: GraphQLBoolean,
      resolve: (it) => it.private,
    },
    includesPurchasedArtworks: {
      type: GraphQLBoolean,
      resolve: ({ includes_purchased_artworks }) => includes_purchased_artworks,
    },
  }),
})

export const MyCollectionInfo: GraphQLFieldConfig<void, ResolverContext> = {
  type: MyCollectionInfoType,
  description: "The current user's MyCollection general information",
  resolve: (_root, {}, { meMyCollectionInfoLoader }) => {
    if (!meMyCollectionInfoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    return meMyCollectionInfoLoader().then(
      (myCollectionInfo) => myCollectionInfo
    )
  },
}
