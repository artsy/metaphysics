import { ResolverContext } from "types/graphql"
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { ArticleImageSection } from "../models"
import { ArtworkType } from "schema/v2/artwork"

export const ArticleSectionImageCollection = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionImageCollection",
  isTypeOf: (section) => {
    return section.type === "image_collection"
  },
  fields: () => ({
    layout: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "ArticleSectionImageCollectionLayout",
          values: {
            COLUMN_WIDTH: { value: "column_width" },
            OVERFLOW_FILLWIDTH: { value: "overflow_fillwidth" },
            FILLWIDTH: { value: "fillwidth" },
          },
        })
      ),
    },
    figures: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLUnionType({
              name: "ArticleSectionImageCollectionFigure",
              types: [ArtworkType, ArticleImageSection],
              resolveType: (image) => {
                if (image.type === "image") {
                  return ArticleImageSection
                }

                return ArtworkType
              },
            })
          )
        )
      ),
      resolve: (section, _args, { artworkLoader }) => {
        return Promise.all(
          section.images.map((image) => {
            if (image.type === "artwork") {
              // Articles may have unpublished artworks
              return artworkLoader(image.slug).catch(() => null)
            }

            return Promise.resolve(image)
          })
          // Filter out any null (unpublished) figures
        ).then((figures) => figures.filter(Boolean))
      },
    },
  }),
})
