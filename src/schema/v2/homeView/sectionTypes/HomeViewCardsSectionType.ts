import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  emptyConnection,
} from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./standardSectionFields"
import Image from "schema/v2/image"

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

const HomeViewCardConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewCardType,
}).connectionType

export const HomeViewCardsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCards,
  description: "A section containing a list of navigation cards",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    cardsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
