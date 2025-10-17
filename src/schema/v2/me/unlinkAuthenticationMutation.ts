import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { meType } from "./index"
import { AuthenticationProviderType } from "./authentications"
import { formatGravityError } from "lib/gravityErrorHandler"

export const unlinkAuthenticationMutation = mutationWithClientMutationId({
  name: "UnlinkAuthenticationMutation",
  description: "Unlinks a 3rd party account",
  inputFields: {
    provider: { type: new GraphQLNonNull(AuthenticationProviderType) },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async ({ provider }, { unlinkAuthenticationLoader }) => {
    if (!unlinkAuthenticationLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await unlinkAuthenticationLoader(provider)
      return {}
    } catch (err) {
      throw new Error(formatGravityError(err).message)
    }
  },
})
