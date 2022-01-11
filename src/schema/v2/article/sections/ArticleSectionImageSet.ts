import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ArtworkType } from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"
import { ArticleImageSection } from "../models"

export const ArticleSectionImageSet = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionImageSet",
  isTypeOf: (section) => {
    return section.type === "image_set"
  },
  fields: () => {
    const ArticleSectionImageSetFigure = new GraphQLUnionType({
      name: "ArticleSectionImageSetFigure",
      types: [ArtworkType, ArticleImageSection],
      resolveType: (image) => {
        if (image.type === "image") {
          return ArticleImageSection
        }

        return ArtworkType
      },
    })

    return {
      title: {
        type: GraphQLString,
      },
      layout: {
        type: new GraphQLNonNull(
          new GraphQLEnumType({
            name: "ArticleSectionImageSetLayout",
            values: {
              FULL: { value: "full" },
              MINI: { value: "mini" },
            },
          })
        ),
      },
      cover: {
        type: ArticleSectionImageSetFigure,
        resolve: ({ images }, _args, { artworkLoader }) => {
          if (!images) return null

          const figure = images[0]

          if (figure.type === "artwork") {
            return artworkLoader(figure.slug)
          }
        },
      },
      figures: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ArticleSectionImageSetFigure))
        ),
        resolve: (section, _args, { artworkLoader }) => {
          return Promise.all(
            section.images.map((figure) => {
              if (figure.type === "artwork") {
                return artworkLoader(figure.slug)
              }

              return Promise.resolve(figure)
            })
          )
        },
      },
      counts: {
        type: new GraphQLNonNull(
          new GraphQLObjectType({
            name: "ArticleSectionImageSetCounts",
            fields: {
              figures: {
                type: new GraphQLNonNull(GraphQLInt),
                resolve: ({ images }) => {
                  return images ? images.length : 0
                },
              },
            },
          })
        ),
        resolve: (section) => section,
      },
    }
  },
})
