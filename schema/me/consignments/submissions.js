// @ts-check

import { SubmissionType } from "./submission"

export default {
  type: SubmissionType,
  description: "The current user's submissions",
  resolve: (_root, _tree, _request, { rootValue: { submissionsLoader } }) => {
    if (!submissionsLoader) return null
    return submissionsLoader()
  },
}
