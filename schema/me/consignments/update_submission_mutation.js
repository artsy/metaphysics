import { mutationWithClientMutationId } from "graphql-relay"
import { SubmissionType } from "./submission"

export const config = {
  name: "UpdateSubmissionMutation",
  description: "Update a consigment using Convection",
  inputFields: {
    ...SubmissionType.getFields(),
  },
  outputFields: {
    submission: {
      type: SubmissionType,
      resolve: submission => submission,
    },
  },
  mutateAndGetPayload: (submission, request, { rootValue: { submissionUpdateLoader } }) => {
    if (!submissionUpdateLoader) return null
    return submissionUpdateLoader(submission.id, submission)
  },
}
export default mutationWithClientMutationId(config)
