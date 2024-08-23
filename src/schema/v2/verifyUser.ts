import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const VerifyUserType = new GraphQLObjectType({
  name: "VerifyUser",
  fields: {
    exists: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

export const VerifyUser: GraphQLFieldConfig<void, ResolverContext> = {
  type: VerifyUserType,
  description: "Verify a given user.",
  args: {
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Email address to verify.",
    },
    recaptchaToken: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Recaptcha token.",
    },
  },
  resolve: (_root, { email, recaptchaToken }, { userIdentificationLoader }) => {
    return userIdentificationLoader({ email, recaptcha_token: recaptchaToken })
  },
}
