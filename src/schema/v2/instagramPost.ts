import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"

export const InstagramPostStatusEnum = new GraphQLEnumType({
  name: "InstagramPostStatus",
  values: {
    PENDING: { value: "pending" },
    PUBLISHED: { value: "published" },
    FAILED: { value: "failed" },
  },
})

export const InstagramPostType = new GraphQLObjectType<any, ResolverContext>({
  name: "InstagramPost",
  fields: () => ({
    ...InternalIDFields,
    instagramAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ instagram_account_id }) => instagram_account_id,
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    artworkIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ artwork_ids }) => artwork_ids,
    },
    instagramMediaId: {
      type: GraphQLString,
      resolve: ({ instagram_media_id }) => instagram_media_id,
    },
    permalink: {
      type: GraphQLString,
    },
    caption: {
      type: GraphQLString,
    },
    status: {
      type: InstagramPostStatusEnum,
    },
    publishedAt: date(),
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const InstagramPostConnectionType = connectionWithCursorInfo({
  name: "InstagramPost",
  nodeType: InstagramPostType,
}).connectionType

export const instagramPost: GraphQLFieldConfig<any, ResolverContext> = {
  type: InstagramPostType,
  description: "An Instagram post by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Instagram post",
    },
  },
  resolve: async (_root, { id }, { instagramPostLoader }) => {
    if (!instagramPostLoader) return null
    return instagramPostLoader(id)
  },
}

export const instagramPostsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: InstagramPostConnectionType,
  description: "A connection of Instagram posts for a partner",
  args: pageable({
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to filter posts by",
    },
  }),
  resolve: async (_root, args, { instagramPostsLoader }) => {
    if (!instagramPostsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await instagramPostsLoader({
      partner_id: args.partnerId,
      total_count: true,
      size,
      offset,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
