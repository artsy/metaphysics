import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { date } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

export const StringList = new GraphQLNonNull(
  new GraphQLList(new GraphQLNonNull(GraphQLString))
)

export const PartnerPermissionPresetType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerPermissionPreset",
  description: "A named set of partner permissions, such as viewer or owner.",
  fields: () => ({
    description: { type: GraphQLString },
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ display_name }) => display_name,
    },
    key: { type: new GraphQLNonNull(GraphQLString) },
    permissions: { type: StringList },
  }),
})

const PartnerPermissionGrantUserType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerPermissionGrantUser",
  fields: () => ({
    ...InternalIDFields,
    email: { type: GraphQLString },
    name: { type: GraphQLString },
  }),
})

export const PartnerPermissionGrantType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerPermissionGrant",
  description: "What one user can do in ArtOS for one partner.",
  fields: () => ({
    ...InternalIDFields,
    createdAt: date(({ created_at }) => created_at),
    effectivePermissions: {
      type: StringList,
      description:
        "The permissions the grant allows, with its preset resolved.",
      resolve: ({ effective_permissions }) => effective_permissions,
    },
    grantedBy: {
      type: PartnerPermissionGrantUserType,
      resolve: ({ granted_by }) => granted_by,
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    permissions: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "The grant's own permissions, when it has no preset.",
    },
    preset: {
      type: PartnerPermissionPresetType,
      resolve: async (
        { preset_key, partner_id },
        _args,
        { partnerPermissionPresetsLoader }
      ) => {
        if (!preset_key || !partnerPermissionPresetsLoader) return null
        // The loader caches per request, so a page of grants makes one call.
        const presets = await partnerPermissionPresetsLoader({ partner_id })
        return presets.find(({ key }) => key === preset_key) ?? null
      },
    },
    presetKey: {
      type: GraphQLString,
      resolve: ({ preset_key }) => preset_key,
    },
    updatedAt: date(({ updated_at }) => updated_at),
    user: {
      type: PartnerPermissionGrantUserType,
      resolve: ({ user }) => user,
    },
  }),
})

export const partnerPermissionGrantsConnection = connectionWithCursorInfo({
  nodeType: PartnerPermissionGrantType,
})

export const PartnerPermissionGrantsConnectionField: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Who can use ArtOS for this partner, and what they can do.",
  type: partnerPermissionGrantsConnection.connectionType,
  args: pageable({}),
  resolve: async (
    { id: partnerID },
    args,
    { partnerPermissionGrantsLoader }
  ) => {
    if (!partnerPermissionGrantsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const { body, headers } = await partnerPermissionGrantsLoader({
      partner_id: partnerID,
      page,
      size,
      total_count: true,
    })

    return paginationResolver({
      totalCount: parseInt(headers["x-total-count"] || "0", 10),
      offset,
      page,
      size,
      body,
      args,
    })
  },
}

export const PartnerPermissionPresetsField: GraphQLFieldConfig<
  void,
  ResolverContext,
  { partnerID: string }
> = {
  description:
    "The presets that can be granted on a partner. Requires access to the partner's grants.",
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(PartnerPermissionPresetType))
  ),
  args: { partnerID: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_root, { partnerID }, { partnerPermissionPresetsLoader }) => {
    if (!partnerPermissionPresetsLoader) return []
    return partnerPermissionPresetsLoader({ partner_id: partnerID })
  },
}
