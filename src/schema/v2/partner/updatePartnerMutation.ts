import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Partner from "./partner"
import { ResolverContext } from "types/graphql"

interface UpdatePartnerMutationInputProps {
  id: string
  alternateNames?: string[] | null
  artsyCollectsSalesTax?: boolean | null
  commissionRate?: number | null
  contractType?: string | null
  directlyContactable?: boolean | null
  displayArtistsSection?: boolean | null
  displayName?: string | null
  displayWorksSection?: boolean | null
  distinguishRepresentedArtists?: boolean | null
  email?: string | null
  givenName?: string | null
  hasFullProfile?: boolean | null
  preQualify?: boolean | null
  profileArtistsLayout?: string | null
  profileBannerDisplay?: string | null
  region?: string | null
  shortName?: string | null
  sortableName?: string | null
  type?: string | null
  website?: string | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    partner: {
      type: Partner.type,
      resolve: (partner) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerMutation = mutationWithClientMutationId<
  UpdatePartnerMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerMutation",
  description: "Updates general information on a partner.",
  inputFields: {
    alternateNames: {
      type: new GraphQLList(GraphQLString),
      description: "Alternate names or synonyms for this partner.",
    },
    artsyCollectsSalesTax: {
      type: GraphQLBoolean,
      description: "Whether to charge sales tax on ecommerce orders.",
    },
    commissionRate: {
      type: GraphQLFloat,
      description: "Commission paid by non-subscriber/fair partner.",
    },
    contractType: {
      type: GraphQLString,
      description: "Contract type.",
    },
    directlyContactable: {
      type: GraphQLBoolean,
      description: "Whether the partner is directly contactable.",
    },
    displayArtistsSection: {
      type: GraphQLBoolean,
      description:
        "Controls artists tab presence on gpp. Artists tab is hidden for Institutional partners and present for the rest of partners.",
    },
    displayName: {
      type: GraphQLString,
      description: "The display name of the partner.",
    },
    displayWorksSection: {
      type: GraphQLBoolean,
      description: "Controls whether the works section is displayed.",
    },
    distinguishRepresentedArtists: {
      type: GraphQLBoolean,
      description:
        "Distinguish artists the partner represents on their profile page.",
    },
    email: {
      type: GraphQLString,
      description: "The email of the partner.",
    },
    givenName: {
      type: GraphQLString,
      description: "The given name of the partner.",
    },
    hasFullProfile: {
      type: GraphQLBoolean,
      description: "Profile completeness.",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    preQualify: {
      type: GraphQLBoolean,
      description: "Whether the partner requires pre-qualification.",
    },
    profileArtistsLayout: {
      type: GraphQLString,
      description: "Artists layout on the profile overview page.",
    },
    profileBannerDisplay: {
      type: GraphQLString,
      description: "Banner display on the profile overview page.",
    },
    region: {
      type: GraphQLString,
      description: "The region of the partner.",
    },
    shortName: {
      type: GraphQLString,
      description: "The short name of the partner.",
    },
    sortableName: {
      type: GraphQLString,
      description: "The sortable name of the partner.",
    },
    type: {
      type: GraphQLString,
      description: "Type of the partner.",
    },
    website: {
      type: GraphQLString,
      description: "The website of the partner.",
    },
  },
  outputFields: {
    partnerOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      alternateNames,
      artsyCollectsSalesTax,
      commissionRate,
      contractType,
      directlyContactable,
      displayArtistsSection,
      displayName,
      displayWorksSection,
      distinguishRepresentedArtists,
      email,
      givenName,
      hasFullProfile,
      preQualify,
      profileArtistsLayout,
      profileBannerDisplay,
      region,
      shortName,
      sortableName,
      type,
      website,
    },
    { updatePartnerLoader }
  ) => {
    if (!updatePartnerLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const partnerData = {
        alternate_names: alternateNames,
        artsy_collects_sales_tax: artsyCollectsSalesTax,
        commission_rate: commissionRate,
        contract_type: contractType,
        directly_contactable: directlyContactable,
        display_artists_section: displayArtistsSection,
        display_name: displayName,
        display_works_section: displayWorksSection,
        distinguish_represented_artists: distinguishRepresentedArtists,
        email: email,
        given_name: givenName,
        has_full_profile: hasFullProfile,
        pre_qualify: preQualify,
        profile_artists_layout: profileArtistsLayout,
        profile_banner_display: profileBannerDisplay,
        region: region,
        short_name: shortName,
        sortable_name: sortableName,
        type: type,
        website: website,
      }

      const response = await updatePartnerLoader(id, partnerData)
      return response
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
