import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"
import { AuthenticationProviderType, Provider } from "./authentications"
import { snakeCase } from "lodash"

interface Input {
  provider: Provider
  oauthToken: string
  applieUid?: string
  idToken?: string
  name?: string
  email?: string
}

interface GravityError {
  statusCode: number
  body: { error?: string; text?: string; message?: string }
}

export const linkAuthenticationMutation = mutationWithClientMutationId<
  Input,
  any | null, // TODO: Type Me return type
  ResolverContext
>({
  name: "LinkAuthenticationMutation",
  description: "Links a 3rd party account",
  inputFields: {
    provider: {
      type: new GraphQLNonNull(AuthenticationProviderType),
      description: "A 3rd party account provider, such as facebook or apple.",
    },
    oauthToken: {
      type: new GraphQLNonNull(GraphQLString),
      description: "An OAuth token.",
    },
    applieUid: {
      type: GraphQLString,
      description:
        "Unique Apple user id. **Required** for Apple authentication.",
    },
    idToken: {
      type: GraphQLString,
      description: "JWT used for Apple authentication.",
    },
    name: {
      type: GraphQLString,
      description: "User name, only used for Apple authentication.",
    },
    email: {
      type: GraphQLString,
      description: "User email, only used for Apple authentication.",
    },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (
    { provider, ...rest },
    { linkAuthenticationLoader }
  ) => {
    if (!linkAuthenticationLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const gravityOptions = Object.keys(rest).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: rest[key] }),
      {}
    )

    try {
      return await linkAuthenticationLoader(provider, gravityOptions)
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error ?? e.body.message)
      }

      throw err
    }
  },
})
