import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v1/object_identification"
import dateField, { date } from "../fields/date"

const dateFieldForVerificationExpiresAt: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  ...dateField,
  resolve: (
    { invitation_expires_at: expiresAt },
    { format, timezone },
    { defaultTimezone }
  ) => {
    const rawDate = expiresAt

    const timezoneString = timezone ? timezone : defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}

const IdentityVerificationType = new GraphQLObjectType<any, ResolverContext>({
  name: "IdentityVerificationType",
  fields: {
    ...InternalIDFields,
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Where the identity verification is in its lifecycle",
    },
    userID: {
      description: "User ID of the identity verification's owner",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ user_id }) => user_id,
    },
    invitationExpiresAt: dateFieldForVerificationExpiresAt,
  },
})

export const IdentityVerification: GraphQLFieldConfig<void, ResolverContext> = {
  type: IdentityVerificationType,
  description: "An identity verification that the user has access to",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the IdentityVerification",
    },
  },
  resolve: (_root, { id }, { identityVerificationLoader }) => {
    if (!identityVerificationLoader) return null
    return identityVerificationLoader(id)
  },
}
