import { mutationWithClientMutationId, MutationConfig } from "graphql-relay"
import { SubmissionType } from "./submission"
import { omit } from "lodash"
import { ResolverContext } from "types/graphql"

export const config: MutationConfig<any, any, ResolverContext> = {
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
  mutateAndGetPayload: (submission, { submissionUpdateLoader }) => {
    if (!submissionUpdateLoader) return null
    return submissionUpdateLoader(submission.id, submission)
  },
}

export default mutationWithClientMutationId(config)
