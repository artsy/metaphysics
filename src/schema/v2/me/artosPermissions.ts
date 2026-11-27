import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { PartnerType } from "schema/v2/partner/partner"
import { StringList } from "schema/v2/partner/partnerPermissionGrant"
import { ResolverContext } from "types/graphql"

const ArtOSPermissionSourceEnum = new GraphQLEnumType({
  name: "ArtOSPermissionSource",
  values: {
    GRANT: { value: "grant" },
    ROLE: { value: "role" },
  },
})

const ArtOSPermissionsType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtOSPermissions",
  fields: () => ({
    permissions: { type: StringList },
    source: {
      type: ArtOSPermissionSourceEnum,
      description:
        "Where the access comes from: a grant, or the artos_support role. Null when there is none.",
    },
  }),
})

export const ArtOSPermissionsField: GraphQLFieldConfig<
  void,
  ResolverContext,
  { partnerID: string }
> = {
  description: "What the current user can do in ArtOS for a partner.",
  type: ArtOSPermissionsType,
  args: { partnerID: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_root, { partnerID }, { mePartnerPermissionsLoader }) => {
    if (!mePartnerPermissionsLoader) return null
    return mePartnerPermissionsLoader({ partner_id: partnerID })
  },
}

export const ArtOSPartnersField: GraphQLFieldConfig<void, ResolverContext> = {
  description:
    "Partners the current user holds an ArtOS grant for, for choosing a partner without CMS access.",
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PartnerType))),
  resolve: async (
    _root,
    _args,
    { mePartnerPermissionGrantsLoader, partnersLoader }
  ) => {
    if (!mePartnerPermissionGrantsLoader || !partnersLoader) return []
    const grants = await mePartnerPermissionGrantsLoader()
    if (grants.length === 0) return []

    // One call for every partner; a partner that no longer exists is left out.
    const ids = grants.map(({ partner_id }) => partner_id)
    const { body } = await partnersLoader({ id: ids, size: ids.length })
    return body
  },
}
