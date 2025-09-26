import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import Image from "schema/v2/image"

export type HomeViewCard = {
  badgeText?: string
  buttonText?: string
  entityID?: string
  entityType?: string
  href?: string
  imageURL?: string
  imageURLs?: string[]
  subtitle?: string
  title?: string
}

export const HomeViewCardType = new GraphQLObjectType<
  HomeViewCard,
  ResolverContext
>({
  name: "HomeViewCard",
  fields: {
    badgeText: { type: GraphQLString },
    buttonText: { type: GraphQLString },
    href: { type: GraphQLString },
    entityType: { type: GraphQLString },
    entityID: { type: GraphQLString },
    image: {
      type: Image.type,
      resolve: ({ imageURL, imageURLs }) => {
        if (imageURL && imageURLs) {
          throw new Error(
            "HomeViewCard cannot have both imageURL and imageURLs fields. Please provide only one."
          )
        }

        if (imageURL) {
          return {
            image_url: imageURL,
          }
        }
      },
    },
    images: {
      type: new GraphQLList(Image.type),
      resolve: ({ imageURL, imageURLs }) => {
        if (imageURL && imageURLs) {
          throw new Error(
            "HomeViewCard cannot have both imageURL and imageURLs fields. Please provide only one."
          )
        }

        if (imageURL) {
          return [
            {
              image_url: imageURL,
            },
          ]
        } else if (imageURLs) {
          return imageURLs.map((imageURL) => {
            return {
              image_url: imageURL,
            }
          })
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
