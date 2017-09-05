import { mutationWithClientMutationId } from "graphql-relay"
import { SubmissionType } from "./submission"

export default mutationWithClientMutationId({
  name: "UpdateSubmissionMutation",
  description: "Update a consigment using Convection",
  inputFields: {
    ...SubmissionType.getFields(),
  },
  outputFields: {
    submission: {
      type: SubmissionType,
      resolve: response => response,
    },
  },
  mutateAndGetPayload: (submission, request, { rootValue: { submissionUpdateLoader } }) => {
    if (!submissionUpdateLoader) return null
    return submissionUpdateLoader(submission.id, submission)
  },
})
