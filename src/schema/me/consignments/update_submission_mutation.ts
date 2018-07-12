import { mutationWithClientMutationId } from "graphql-relay"
import { SubmissionType } from "./submission"
import { omit } from "lodash"

export const config = {
  name: "UpdateSubmissionMutation",
  description: "Update a consignment using Convection",
  inputFields: {
    ...omit(SubmissionType.getFields(), ["__id", "_id", "artist"]),
  } as any,
  outputFields: {
    consignment_submission: {
      type: SubmissionType,
      resolve: submission => submission,
    },
  },
  mutateAndGetPayload: (
    submission,
    _request,
    { rootValue: { submissionUpdateLoader } }
  ) => {
    if (!submissionUpdateLoader) return null
    return submissionUpdateLoader(submission.id, submission)
  },
}
export default mutationWithClientMutationId(config)
