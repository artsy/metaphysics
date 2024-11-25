import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GravityARImageType } from "./GravityARImageType"

export const ViewingRoomSubsectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomSubsection",
  fields: () => {
    return {
      internalID: {
        description: "A type-specific ID likely used as a database ID.",
        type: new GraphQLNonNull(GraphQLID),
        resolve: ({ id }) => id,
      },
      body: {
        type: GraphQLString,
      },
      caption: {
        type: GraphQLString,
      },
      image: {
        type: GravityARImageType,
      },
      imageURL: {
        type: GraphQLString,
        resolve: ({ image_url }) => image_url,
      },
      title: {
        type: GraphQLString,
      },
    }
  },
})
