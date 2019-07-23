import { mutationWithClientMutationId, MutationConfig } from "graphql-relay"
import { SharedInputOutputFields, SubmissionType } from "./submission"
import { ResolverContext } from "types/graphql"
import { GraphQLNonNull, GraphQLString } from "graphql"

export const config: MutationConfig<any, any, ResolverContext> = {
  name: "UpdateSubmissionMutation",
  description: "Update a consignment using Convection",
  inputFields: {
    id: {
      description: "The GUID for the submission",
      type: new GraphQLNonNull(GraphQLString),
    },
    ...SharedInputOutputFields,
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
