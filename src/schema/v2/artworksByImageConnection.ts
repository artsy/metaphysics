import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { paginationResolver } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const artworksByImageConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description:
    "A connection of artworks matching an uploaded query image, using a pure vector (neural) image search.",
  type: artworkConnection.connectionType,
  args: pageable({
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the uploaded query image.",
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket of the uploaded query image.",
    },
  }),
  resolve: async (
    _root,
    args: { s3Key: string; s3Bucket: string } & CursorPageable,
    { artworksByImageLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await artworksByImageLoader({
      image: {
        s3_key: args.s3Key,
        s3_bucket: args.s3Bucket,
      },
      page,
      size,
      total_count: true,
    })

    const { hits = [] } = body
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body: hits,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
