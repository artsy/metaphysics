import Image from "../image"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "../fields/pagination"

export const HomeViewCardType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeViewCard",
  fields: {
    href: { type: GraphQLString },
    entityType: { type: GraphQLString },
    entityID: { type: GraphQLString },
    image: {
      type: Image.type,
      resolve: ({ image_url }) => {
        if (image_url) {
          return {
            image_url,
          }
        }
      },
    },
    subtitle: { type: GraphQLString },
    title: { type: GraphQLNonNull(GraphQLString) },
  },
})

export const HomeViewCardConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewCardType,
}).connectionType

const HomeViewCard: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomeViewCardType,
}

export default HomeViewCard
