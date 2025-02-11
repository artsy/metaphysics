import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import Image from "schema/v2/image"

export type HomeViewCard = {
  buttonText?: string
  entityID?: string
  entityType?: string
  hint?: string
  href?: string
  image_url?: string
  subtitle?: string
  title?: string
}

export const HomeViewCardType = new GraphQLObjectType<
  HomeViewCard,
  ResolverContext
>({
  name: "HomeViewCard",
  fields: {
    buttonText: { type: GraphQLString },
    hint: { type: GraphQLString },
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

export const HomeViewCardSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCard,
  description: "A section that consists of a single navigation card",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    card: {
      type: HomeViewCardType,
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
