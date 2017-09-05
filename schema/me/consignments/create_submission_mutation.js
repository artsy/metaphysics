import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SubmissionType } from "./index"

export default mutationWithClientMutationId({
  name: "CreateSubmissionMutation",
  description: "Create a new consigment using Convection",
  inputFields: {
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the artist",
    },
  },
  outputFields: {
    submission: {
      type: SubmissionType,
      resolve: response => response,
    },
  },
  mutateAndGetPayload: ({ id, artist_id }, request, { rootValue: { submissionCreateLoader } }) => {
    if (!submissionCreateLoader) return null
    return submissionCreateLoader(id, { artist_id })
  },
})
