import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import Image from "schema/v2/image"
import {
  connectionWithCursorInfo,
  emptyConnection,
} from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import {
  HomeViewGenericSectionInterface,
  standardSectionFields,
} from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"

export type HomeViewCityGuideCard = {
  /** `null` for the "Explore city near me" card */
  citySlug: string | null
  title: string
  href: string
  imageURL?: string
  chips: string[]
}

export const HomeViewCityGuideCardType = new GraphQLObjectType<
  HomeViewCityGuideCard,
  ResolverContext
>({
  name: "HomeViewCityGuideCard",
  description:
    "A card linking to a city's City Guide, or to the City Guide for the city nearest the user",
  fields: {
    citySlug: {
      type: GraphQLString,
      description:
        'The city\'s slug, or `null` for the "Explore city near me" card, where the app picks the city',
    },
    title: { type: new GraphQLNonNull(GraphQLString) },
    href: { type: new GraphQLNonNull(GraphQLString) },
    image: {
      type: Image.type,
      description:
        "The card's image. The rail has no background image of its own: clients use a blurred version of the current card's image",
      resolve: ({ imageURL }) => (imageURL ? { image_url: imageURL } : null),
    },
    chips: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        'Count chips in display order, e.g. ["6 Curated Guides", "100+ Shows"]. Counts that are zero or failed to load are left out, so this can be empty',
    },
  },
})

const HomeViewCityGuideCardConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewCityGuideCardType,
}).connectionType

export const HomeViewCityGuidesSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCityGuides,
  description: "A rail of cards linking to City Guides",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    cardsConnection: {
      type: HomeViewCityGuideCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
