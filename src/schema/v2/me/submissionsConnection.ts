import { GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import ArtworkConsignmentSubmissionType from "../artwork/artworkConsignmentSubmissionType"
import { connectionWithCursorInfo } from "../fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"

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
    complete: {
      description: `
If true, only return submissions that are complete (approved, rejected, or closed).
if false, only return submissions that are not complete (draft).
If not provided/undefined, return all submissions.
      `,
      type: GraphQLBoolean,
      defaultValue: undefined,
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
      completed: options.complete,
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
