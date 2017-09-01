import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ConsignmentType } from "./index"

export default mutationWithClientMutationId({
  name: "CreateConsignmentMutation",
  description: "Create a new consigment using Convection",
  inputFields: {
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the artist",
    },
  },
  outputFields: {
    consignment: {
      type: ConsignmentType,
      resolve: ({ consignment }) => consignment,
    },
  },
  mutateAndGetPayload: ({ id, artist_id }, request, { rootValue: { convectionLoader, submissionCreateLoader } }) => {
    if (!submissionCreateLoader) return null
    console.log("Happening:")

    return submissionCreateLoader(id, { artist_id }).then(a => {
      console.log("HI, ok")
      console.log(a)
      return convectionLoader(id).then(updatedConversation => {
        return {
          submission: updatedConversation,
        }
      })
    })
  },
})
