import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"
import { AuthenticationProviderType } from "./authentications"

interface Input {
  provider: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const unlinkAuthenticationMutation = mutationWithClientMutationId<
  Input,
  any | null, // TODO: Type Me return type
  ResolverContext
>({
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
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
