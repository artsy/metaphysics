import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { GravityARImageType } from "./GravityARImageType"
import { InternalIDField } from "./object_identification"

export const ViewingRoomSubsectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomSubsection",
  fields: () => {
    return {
      ...InternalIDField,
      body: {
        type: GraphQLString,
      },
      caption: {
        type: GraphQLString,
      },
      image: {
        type: GravityARImageType,
      },
      title: {
        type: GraphQLString,
      },
    }
  },
})
