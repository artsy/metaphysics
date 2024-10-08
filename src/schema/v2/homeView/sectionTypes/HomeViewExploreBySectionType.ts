import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"
import { standardSectionFields } from "../standardSectionFields"
import { ImageType } from "../../image"

export const ExploreByMarketingCollectionCategory = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ExploreByMarketingCollectionCategory",
  description:
    "[deprecated in favor of `HomeViewCard`] A marketing collection category to explore by",
  fields: () => ({
    href: {
      type: GraphQLNonNull(GraphQLString),
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
    },
    image: {
      type: ImageType,
      resolve: ({ image }) => {
        const { image_url } = image
        return {
          image_url,
          original_width: 180,
          original_height: 180,
          quality: 80,
        }
      },
    },
  }),
})

export const HomeViewExploreBySectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name:
    HomeViewSectionTypeNames.HomeViewSectionExploreByMarketingCollectionCategories,
  description:
    "[deprecated in favor of `HomeViewSectionCards`] Marketing Collection Categories section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    categories: {
      type: GraphQLNonNull(
        GraphQLList(GraphQLNonNull(ExploreByMarketingCollectionCategory))
      ),
      resolve: (parent, ...rest) => {
        return parent.resolver ? parent.resolver(parent, ...rest) : []
      },
    },
  },
})
