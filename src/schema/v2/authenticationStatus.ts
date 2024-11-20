import { GraphQLEnumType, GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

const AuthenticationStatus = new GraphQLEnumType({
  name: "AuthenticationStatus",
  values: {
    LOGGED_IN: { value: "LOGGED_IN" },
    LOGGED_OUT: { value: "LOGGED_OUT" },
    INVALID: { value: "INVALID" },
  },
})

export const authenticationStatus: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(AuthenticationStatus),
  description:
    "If user is logged out; status is `LOGGED_OUT`. If user is logged in; status is `LOGGED_IN`. If user is logged in with invalid authentication (401); 'Promise' resolves to 'Status.Invalid'. All other status codes will resolve to `LOGGED_IN` because we don't know whether or not the authentication is valid (error could be something else).",
  resolve: async (_root, _args, { mePingLoader }) => {
    if (!mePingLoader) return "LOGGED_OUT"

    try {
      await mePingLoader()
    } catch (err) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        return "INVALID"
      }
    }

    return "LOGGED_IN"
  },
}
