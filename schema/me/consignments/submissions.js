// @ts-check

import { SubmissionType } from "./submission"
import { GraphQLBoolean } from "graphql/type/scalars"

export default {
  type: SubmissionType,
  description: "The current user's submissions",
  args: {
    completed: {
      type: GraphQLBoolean,
    },
  },
  resolve: (_root, args, _request, { rootValue: { submissionsLoader } }) => {
    if (!submissionsLoader) return null
    return submissionsLoader(args)
  },
}
