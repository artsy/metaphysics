import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v1/object_identification"
import dateField, { DateSource, date } from "../fields/date"

const dateFieldForVerificationExpiresAt: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  ...dateField,
  resolve: (
    { invitation_expires_at: expiresAt },
    { format, timezone },
    { defaultTimezone, _userAgent },
    { fieldName }
  ) => {
    const rawDate = expiresAt

    // FIXME: copied from partner_show_event.ts needed?
    // if (_userAgent && isOlderEmissionVersion(_userAgent)) {
    //   const dateWithoutOffset = rawDate.replace(/[-+]\d\d:\d\d$/, "")
    //   return dateWithoutOffset
    // }

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
      description: "WIP: where the identity verification is in it's lifecycle",
    },
    userID: {
      type: new GraphQLNonNull(GraphQLString), // TODO: ID type?
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
