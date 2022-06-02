import {
  GraphQLFieldConfig,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { PageInfoType } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  PageCursorsType,
} from "schema/v2/fields/pagination"
import { InternalIDFields } from "schema/v2/object_identification"
import dateField, { formatDate } from "./fields/date"

export type IdentityVerificationGravityResponse = {
  id: string
  state: string
  invitation_expires_at: string
  user_id: string
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
    reason: { type: GraphQLString },
    userID: {
      description: "User ID of the override's creator",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ user_id }) => user_id,
    },
    createdAt: {
      type: GraphQLString,
      resolve: ({ created_at }) => created_at,
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
    jumioID: { type: GraphQLString },
    extractedFirstName: {
      type: GraphQLString,
      resolve: ({ extracted_first_name }) => extracted_first_name,
    },
    extractedLastName: {
      type: GraphQLString,
      resolve: ({ extracted_last_name }) => extracted_last_name,
    },
    finishedAt: {
      type: GraphQLString,
      resolve: ({ finished_at }) => finished_at,
    },
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
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ user_id }) => user_id,
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

        const { body } = await identityVerificationOverridesLoader(id)
        return body
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

        const { body } = await identityVerificationScanReferencesLoader(id)
        return body
      },
    },
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
    if (!(identityVerificationLoader && pending_identity_verification_id))
      return null
    return identityVerificationLoader(user.pending_identity_verification_id)
  },
}

export const IdentityVerificationEdgeInterface = new GraphQLInterfaceType({
  name: "IdentityVerificationEdgeInterface",
  fields: {
    node: {
      type: IdentityVerificationType,
    },
    cursor: {
      type: GraphQLString,
    },
  },
})

export const IdentityVerificationConnectionInterface = new GraphQLInterfaceType(
  {
    name: "IdentityVerificationConnectionInterface",
    fields: {
      pageCursors: { type: new GraphQLNonNull(PageCursorsType) },
      pageInfo: { type: new GraphQLNonNull(PageInfoType) },
      edges: { type: new GraphQLList(IdentityVerificationEdgeInterface) },
    },
  }
)

export const identityVerificationConnection = connectionWithCursorInfo({
  nodeType: IdentityVerificationType,
  connectionInterfaces: [IdentityVerificationConnectionInterface],
  edgeInterfaces: [IdentityVerificationEdgeInterface],
})
