import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import dateField, { date } from "../fields/date"

export type IdentityVerificationGravityResponse = {
  id: string
  state: string
  invitation_expires_at: string
  user_id: string
}

const dateFieldForVerificationExpiresAt: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  ...dateField,
  resolve: (
    { invitation_expires_at: rawDate },
    { format, timezone },
    { defaultTimezone }
  ) => {
    const timezoneString = timezone || defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}

const IdentityVerificationType = new GraphQLObjectType<
  IdentityVerificationGravityResponse,
  ResolverContext
>({
  name: "IdentityVerification",
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
