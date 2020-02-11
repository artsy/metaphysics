import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

const IdentityVerificationType = new GraphQLObjectType<any, ResolverContext>({
  name: "IdentityVerificationType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Primary ID of the requested identity verification",
    },
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "WIP: where the identity verification is in it's lifecycle",
    },
    userID: {
      type: new GraphQLNonNull(GraphQLString), // TODO: ID type?
      resolve: ({ user_id }) => user_id,
    },
  },
})

export const IdentityVerification: GraphQLFieldConfig<void, ResolverContext> = {
  type: IdentityVerificationType,
  description: "An identity verification",
  resolve: (_root, _option, { meIdentityVerificationLoader }) => {
    if (!meIdentityVerificationLoader) return null
    return meIdentityVerificationLoader("b408d2c0-e164-422e-9273-9830fb48a054")
    /*
      const idv = identityVerificationLoader(id)
      if (!idv || idv.userId !== _root.internalID) {
        throw GraphQL Error('something something etc')
      } else {
        return {
          ... the idv in the shape we want
        }
      }
     */
  },
}
