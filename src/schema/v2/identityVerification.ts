import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { InternalIDFields } from "schema/v2/object_identification"
import { UserField } from "schema/v2/user"
import dateField, { date, formatDate } from "./fields/date"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export type IdentityVerificationGravityResponse = {
  id: string
  state: string
  invitation_expires_at: string
  user_id: string
  created_at: string
  name: string
  email: string
}

export type IdentityVerificationOverrideGravityResponse = {
  id: string
  new_state: string
  old_state: string
  reason: string
  user_id: string
  created_at: string
}

export type IdentityVerificationScanReferenceGravityResponse = {
  id: string
  jumio_id: string
  extracted_first_name: string
  extracted_last_name: string
  finished_at: string
  result: string
  extracted_id_fail_reason: string
  extracted_similarity_fail_reason: string
  created_at: string
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
    return formatDate(rawDate, format, timezoneString)
  },
}

export const IdentityVerificationOverrideType = new GraphQLObjectType<
  IdentityVerificationOverrideGravityResponse,
  ResolverContext
>({
  name: "IdentityVerificationOverride",
  fields: {
    ...InternalIDFields,
    newState: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Overridden state",
      resolve: ({ new_state }) => new_state,
    },
    oldState: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Un-overridden state",
      resolve: ({ old_state }) => old_state,
    },
    reason: { type: new GraphQLNonNull(GraphQLString) },
    userID: {
      description: "User ID of the override's creator",
      type: GraphQLString,
      resolve: ({ user_id }) => user_id,
    },
    createdAt: date(({ created_at }) => created_at),
    creator: {
      type: UserField.type,
      resolve: ({ user_id }, _args, { userByIDLoader }) => {
        if (!userByIDLoader) return
        return userByIDLoader(user_id).catch(() => null)
      },
    },
  },
})

export const IdentityVerificationScanReferenceType = new GraphQLObjectType<
  IdentityVerificationScanReferenceGravityResponse,
  ResolverContext
>({
  name: "IdentityVerificationScanReference",
  fields: {
    ...InternalIDFields,
    jumioID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ jumio_id }) => jumio_id,
    },
    extractedFirstName: {
      type: GraphQLString,
      resolve: ({ extracted_first_name }) => extracted_first_name,
    },
    extractedLastName: {
      type: GraphQLString,
      resolve: ({ extracted_last_name }) => extracted_last_name,
    },
    finishedAt: date(({ finished_at }) => finished_at),
    result: { type: GraphQLString },
    extractedIdFailReason: {
      type: GraphQLString,
      resolve: ({ extracted_id_fail_reason }) => extracted_id_fail_reason,
    },
    extractedSimilarityFailReason: {
      type: GraphQLString,
      resolve: ({ extracted_similarity_fail_reason }) =>
        extracted_similarity_fail_reason,
    },
    createdAt: date(({ created_at }) => created_at),
  },
})

export const IdentityVerificationType = new GraphQLObjectType<
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
      type: GraphQLString,
      resolve: ({ user_id }) => user_id,
    },
    name: {
      description: "Name of the identity verification's owner",
      type: GraphQLString,
      resolve: ({ name }) => name,
    },
    email: {
      description: "Email of the identity verification's owner",
      type: GraphQLString,
      resolve: ({ email }) => email,
    },
    invitationExpiresAt: dateFieldForVerificationExpiresAt,
    overrides: {
      type: new GraphQLList(IdentityVerificationOverrideType),
      description: "The overrides associated with an identity verification",
      resolve: async (
        { id },
        _args,
        { identityVerificationOverridesLoader }
      ) => {
        if (!identityVerificationOverridesLoader) return

        return identityVerificationOverridesLoader(id)
      },
    },
    scanReferences: {
      type: new GraphQLList(IdentityVerificationScanReferenceType),
      description:
        "The scan references (i.e., results) associated with an identity verification",
      resolve: async (
        { id },
        _args,
        { identityVerificationScanReferencesLoader }
      ) => {
        if (!identityVerificationScanReferencesLoader) return

        return identityVerificationScanReferencesLoader(id)
      },
    },
    createdAt: date(({ created_at }) => created_at),
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

export const PendingIdentityVerification: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: IdentityVerificationType,
  description:
    "The user's most current pending identity verification, if it exists",
  resolve: (user, _args, { identityVerificationLoader }) => {
    const { pending_identity_verification_id } = user
    if (!pending_identity_verification_id) return null
    return identityVerificationLoader(pending_identity_verification_id)
  },
}

export const identityVerificationsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of identity verifications.",
  type: connectionWithCursorInfo({ nodeType: IdentityVerificationType })
    .connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    userId: { type: GraphQLString },
    email: { type: GraphQLString },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { identityVerificationsLoader }
  ) => {
    if (!identityVerificationsLoader) return

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const { body, headers } = await identityVerificationsLoader({
      total_count: true,
      page,
      size,
      user_id: args.userId,
      email: args.email,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
