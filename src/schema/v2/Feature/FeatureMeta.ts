import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { Gravity } from "types/runtime"
import { ResolverContext } from "types/graphql"
import { markdownToText } from "lib/helpers"

const DEFAULT_META_DESCRIPTION =
  "Artsy is the world’s largest online art marketplace. Browse over 1 million artworks by iconic and emerging artists, presented by 4000+ galleries and top auction houses in over 100 countries."

export const FeatureMetaType = new GraphQLObjectType<
  Gravity.Feature,
  ResolverContext
>({
  name: "FeatureMeta",
  description: "Meta-tag related fields for Features",
  fields: () => ({
    name: {
      deprecationReason: "Use `title` instead",
      type: new GraphQLNonNull(GraphQLString),
      resolve: titleResolver,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: titleResolver,
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ description }) => {
        if (!description) return DEFAULT_META_DESCRIPTION

        return markdownToText(description)
      },
    },
    image: {
      type: GraphQLString,
      resolve: ({ image_urls }) => {
        return image_urls?.large_rectangle
      },
    },
  }),
})

const titleResolver = ({ name, meta_title }: Gravity.Feature) => {
  return meta_title || `${name} | Artsy`
}
