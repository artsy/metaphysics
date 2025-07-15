import { GraphQLFieldConfig, GraphQLList } from "graphql"
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
    states: {
      type: new GraphQLList(ArtworkConsignmentSubmissionStateType),
    },
  }),
  description: "A list of the current user’s submissions",
  resolve: async (_, options, { submissionsLoader }) => {
    if (!submissionsLoader) {
      throw new Error("You need to be signed in to query for submission")
    }

    const { offset } = getPagingParameters(options)

    try {
      const { body: submissions, headers } = await submissionsLoader()

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
