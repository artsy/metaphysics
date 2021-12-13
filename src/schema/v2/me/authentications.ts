import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"

interface Authentication {
  id: string
  uid: string
  provider: "apple" | "facebook" | "google"
}

const AuthenticationProviderType = new GraphQLEnumType({
  name: "AuthenticationProvider",
  values: {
    APPLE: { value: "apple" },
    FACEBOOK: { value: "facebook" },
    GOOGLE: { value: "google" },
  },
})

const AuthenticationType = new GraphQLObjectType<
  Authentication,
  ResolverContext
>({
  name: "AuthenticationType",
  fields: {
    ...InternalIDFields,
    uid: { type: new GraphQLNonNull(GraphQLString) },
    provider: { type: new GraphQLNonNull(AuthenticationProviderType) },
  },
})

export const authentications: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(AuthenticationType))
  ),
  description: "A list of authenticated external services",
  resolve: async (_root, _args, { authenticationsLoader }) => {
    if (!authenticationsLoader) return null
    const { body } = await authenticationsLoader()
    return body
  },
}
