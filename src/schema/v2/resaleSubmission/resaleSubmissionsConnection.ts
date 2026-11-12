import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { keyBy, uniq } from "lodash"
import { pageable } from "relay-cursor-paging"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { ResaleSubmissionRecord } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionType } from "./resaleSubmission"

export const ResaleSubmissionsConnectionType = connectionWithCursorInfo({
  nodeType: ResaleSubmissionType,
}).connectionType

// Submitted works are private My Collection artworks, so load them in one call
// rather than one artworkLoader call per node.
const attachSubmittedArtworks = async (
  submissions: ResaleSubmissionRecord[],
  meMyCollectionArtworksLoader: ResolverContext["meMyCollectionArtworksLoader"]
) => {
  const artworkIDs = uniq(submissions.map((s) => s.submitted_artwork_id))
  if (!artworkIDs.length || !meMyCollectionArtworksLoader) return

  try {
    const { body } = await meMyCollectionArtworksLoader({
      artworks: artworkIDs,
      size: artworkIDs.length,
    })
    const artworksByID = keyBy(body, "_id")

    submissions.forEach((submission) => {
      submission._submitted_artwork =
        artworksByID[submission.submitted_artwork_id]
    })
  } catch (error) {
    console.error("[resaleSubmissionsConnection] artworks failed:", error)
  }
}

export const ResaleSubmissionsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ResaleSubmissionsConnectionType,
  description: "The current user's resale submissions",
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args,
    { resaleSubmissionsLoader, meMyCollectionArtworksLoader }
  ) => {
    if (!resaleSubmissionsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    try {
      const { body, headers } = await resaleSubmissionsLoader({
        page,
        size,
        offset,
        total_count: true,
      })
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      await attachSubmittedArtworks(body, meMyCollectionArtworksLoader)

      return paginationResolver({ totalCount, offset, page, size, body, args })
    } catch (error) {
      return CatchCollectionNotFoundException(error)
    }
  },
}
