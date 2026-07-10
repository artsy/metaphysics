import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { date } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { IDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

const ArtnetNewsAuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetNewsAuthor",
  fields: {
    name: { type: GraphQLString },
    title: { type: GraphQLString },
    photo: {
      type: GraphQLString,
      description: "URL of the author’s avatar",
    },
    facebook: { type: GraphQLString },
    twitter: { type: GraphQLString },
    instagram: { type: GraphQLString },
  },
})

const ArtnetNewsImageType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetNewsImage",
  fields: {
    url: {
      type: GraphQLString,
      resolve: ({ main }) => (Array.isArray(main) ? main[0] : main),
    },
    width: {
      type: GraphQLInt,
      resolve: ({ main }) => (Array.isArray(main) ? main[1] : null),
    },
    height: {
      type: GraphQLInt,
      resolve: ({ main }) => (Array.isArray(main) ? main[2] : null),
    },
    thumbnailUrl: {
      type: GraphQLString,
      description: "URL of a square-cropped variant of the image",
      resolve: ({ thumb }) => (Array.isArray(thumb) ? thumb[0] : thumb),
    },
    alt: { type: GraphQLString },
  },
})

const ArtnetNewsCategoryType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetNewsCategory",
  fields: {
    name: { type: GraphQLString },
    slug: { type: GraphQLString },
  },
})

export const ArtnetNewsArticleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtnetNewsArticle",
  description: "A news article from artnet News",
  fields: () => ({
    ...IDFields,
    authors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtnetNewsAuthorType))
      ),
      resolve: ({ authors }) => authors ?? [],
    },
    body: {
      type: GraphQLString,
      description:
        "Rendered HTML of the article. Only present when fetched via the single-article field.",
    },
    category: { type: ArtnetNewsCategoryType },
    description: {
      type: GraphQLString,
      description: "SEO meta description of the article",
    },
    image: { type: ArtnetNewsImageType },
    publishedAt: date(({ date: publishedAt }) => publishedAt),
    title: { type: GraphQLString },
    updatedAt: date(({ updated }) => updated),
    url: {
      type: GraphQLString,
      description: "Absolute URL of the article on news.artnet.com",
    },
  }),
})

export const ArtnetNewsArticle: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtnetNewsArticleType,
  description: "A single artnet News article, including its body",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artnet News article",
    },
  },
  resolve: async (_root, { id }, { artnetNewsArticleLoader }) => {
    const { data } = await artnetNewsArticleLoader(id)
    return data?.posts?.[0] ?? null
  },
}

export const artnetNewsArticleConnection = connectionWithCursorInfo({
  nodeType: ArtnetNewsArticleType,
})

export const ArtnetNewsArticlesConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: artnetNewsArticleConnection.connectionType,
  description: "A connection of articles from artnet News",
  args: pageable({
    categorySlug: {
      type: GraphQLString,
      description: "Only return articles in this category (WordPress slug)",
    },
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: { categorySlug?: string } & CursorPageable,
    { artnetNewsArticlesLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { data } = await artnetNewsArticlesLoader({
      paged: page,
      posts_per_page: size,
      ...(args.categorySlug && { category_name: args.categorySlug }),
    })

    const totalCount = Number(data?.found_posts) || 0

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connectionFromArraySlice(data?.posts ?? [], args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  },
}
