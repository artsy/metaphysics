import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import ArtworkConsignmentSubmissionType, {
  ArtworkConsignmentSubmissionStateType,
} from "../artwork/artworkConsignmentSubmissionType"
import { connectionWithCursorInfo } from "../fields/pagination"

export const submissionsConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkConsignmentSubmissionType,
}).connectionType

export const submissionsConnection: GraphQLFieldConfig<
  {
    id: string
  },
  ResolverContext
> = {
  type: submissionsConnectionType,
  args: pageable({
    state: {
      type: ArtworkConsignmentSubmissionStateType,
    },
  }),
  description: "A list of the current user’s submissions",
  resolve: async ({ id: userID }, options, { submissionsLoader }) => {
    if (!userID || !submissionsLoader) {
      throw new Error("You need to be signed in to query for submission")
    }

    const { limit: size, offset } = getPagingParameters(options)

    const convectionArgs = {
      size,
      offset,
      total_count: true,
      state: options.state,
    }

    try {
      const { body: submissions, headers } = await submissionsLoader(
        convectionArgs
      )

      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return {
        totalCount,
        ...connectionFromArraySlice(submissions, options, {
          arrayLength: totalCount,
          sliceStart: offset,
        }),
      }
      // return submissions
    } catch (error) {
      console.error(
        `[metaphysics @ submissionsConnection] ${JSON.stringify(error)}`
      )
      return null
    }
  },
}
