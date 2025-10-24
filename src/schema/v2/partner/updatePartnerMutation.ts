import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Partner, { AnalyticsPageTimeFrameEnum } from "./partner"
import { ResolverContext } from "types/graphql"

interface UpdatePartnerMutationInputProps {
  id: string
  adminId?: string | null
  alternateNames?: string[] | null
  analyticsPageTimeFrame?: typeof AnalyticsPageTimeFrameEnum | null
  artsyCollectsSalesTax?: boolean | null
  commissionRate?: number | null
  commerceEnabled?: boolean | null
  criteoEligible?: boolean | null
  contractType?: string | null
  directlyContactable?: boolean | null
  displayArtistsSection?: boolean | null
  displayName?: string | null
  displayWorksSection?: boolean | null
  distinguishRepresentedArtists?: boolean | null
  email?: string | null
  enableAchPaymentMethod?: boolean | null
  enforceOnPlatformTransactions?: boolean | null
  featuredKeywords?: string[] | null
  givenName?: string | null
  hasFullProfile?: boolean | null
  hasLimitedFolioAccess?: boolean | null
  implicitOfferEnabled?: boolean | null
  inquiryOrderEnabled?: boolean | null
  managedByErp?: boolean | null
  outreachAdminId?: string | null
  partnerCategories?: string[] | null
  preQualify?: boolean | null
  profileArtistsLayout?: string | null
  profileBannerDisplay?: string | null
  referralContactId?: string | null
  region?: string | null
  relativeSize?: number | null
  requiresMerchantAccount?: boolean | null
  shortName?: string | null
  sortableName?: string | null
  type?: string | null
  vatNumber?: string | null
  vatStatus?: string | null
  vatExemptApproved?: boolean | null
  verifiedSeller?: boolean | null
  website?: string | null
  wireTransferEnabled?: boolean | null
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
    adminId: {
      type: GraphQLString,
      description: "Admin assigned for this partner.",
    },
    alternateNames: {
      type: new GraphQLList(GraphQLString),
      description: "Alternate names or synonyms for this partner.",
    },
    analyticsPageTimeFrame: {
      type: AnalyticsPageTimeFrameEnum.type,
      description: "Time frame for partner analytics page.",
    },
    artsyCollectsSalesTax: {
      type: GraphQLBoolean,
      description: "Whether to charge sales tax on ecommerce orders.",
    },
    commissionRate: {
      type: GraphQLFloat,
      description: "Commission paid by non-subscriber/fair partner.",
    },
    commerceEnabled: {
      type: GraphQLBoolean,
      description:
        "Partner could opt their works to buy now / make offer and accept payments using their merchant account.",
    },
    criteoEligible: {
      type: GraphQLBoolean,
      description: "Include in Criteo artwork report.",
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
    enableAchPaymentMethod: {
      type: GraphQLBoolean,
      description:
        "Whether the partner should have access to ACH payment method on subscriptions.",
    },
    enforceOnPlatformTransactions: {
      type: GraphQLBoolean,
      description: "Triggers partner on platform transaction notifications.",
    },
    featuredKeywords: {
      type: new GraphQLList(GraphQLString),
      description: "Suggested filters for associated artworks.",
    },
    givenName: {
      type: GraphQLString,
      description: "The given name of the partner.",
    },
    hasFullProfile: {
      type: GraphQLBoolean,
      description: "Profile completeness.",
    },
    hasLimitedFolioAccess: {
      type: GraphQLBoolean,
      description: "Whether this partner has limited Folio access.",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    implicitOfferEnabled: {
      type: GraphQLBoolean,
      description:
        "Partner can have artworks implictly enrolled as 'Make Offer' on the artwork page.",
    },
    inquiryOrderEnabled: {
      type: GraphQLBoolean,
      description:
        "Partner could list artworks for purchasing from inquiry conversations.",
    },
    managedByErp: {
      type: GraphQLBoolean,
      description: "Whether the partner is managed by ERP for subscriptions.",
    },
    outreachAdminId: {
      type: GraphQLString,
      description: "Admin that signed up this partner.",
    },
    partnerCategories: {
      type: new GraphQLList(GraphQLString),
      description: "Array of partner slugs to assign to this partner.",
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
    referralContactId: {
      type: GraphQLString,
      description: "Admin that referred this partner and gets the commission.",
    },
    region: {
      type: GraphQLString,
      description: "The region of the partner.",
    },
    relativeSize: {
      type: GraphQLInt,
      description: "Size of the partner.",
    },
    requiresMerchantAccount: {
      type: GraphQLBoolean,
      description: "Partner is required to configure a merchant account.",
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
    vatNumber: {
      type: GraphQLString,
      description: "The VAT identification number belonging to this partner.",
    },
    vatStatus: {
      type: GraphQLString,
      description:
        "Whether the partner is registered, registered_and_exempt, exempt, or ineligible for a VAT identification number.",
    },
    vatExemptApproved: {
      type: GraphQLBoolean,
      description:
        "Whether the partner's VAT exempt status is approved by Artsy.",
    },
    verifiedSeller: {
      type: GraphQLBoolean,
      description: "Indicates the partner is a trusted seller on Artsy.",
    },
    website: {
      type: GraphQLString,
      description: "The website of the partner.",
    },
    wireTransferEnabled: {
      type: GraphQLBoolean,
      description:
        "Indicates the partner is eligible for manual wire transfers.",
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
      adminId,
      alternateNames,
      analyticsPageTimeFrame,
      artsyCollectsSalesTax,
      commissionRate,
      commerceEnabled,
      criteoEligible,
      contractType,
      directlyContactable,
      displayArtistsSection,
      displayName,
      displayWorksSection,
      distinguishRepresentedArtists,
      email,
      enableAchPaymentMethod,
      enforceOnPlatformTransactions,
      featuredKeywords,
      givenName,
      hasFullProfile,
      hasLimitedFolioAccess,
      implicitOfferEnabled,
      inquiryOrderEnabled,
      managedByErp,
      outreachAdminId,
      partnerCategories,
      preQualify,
      profileArtistsLayout,
      profileBannerDisplay,
      referralContactId,
      region,
      relativeSize,
      requiresMerchantAccount,
      shortName,
      sortableName,
      type,
      vatNumber,
      vatStatus,
      vatExemptApproved,
      verifiedSeller,
      website,
      wireTransferEnabled,
    },
    { updatePartnerLoader }
  ) => {
    if (!updatePartnerLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const partnerData = {
        admin_id: adminId,
        alternate_names: alternateNames,
        analytics_page_time_frame: analyticsPageTimeFrame,
        artsy_collects_sales_tax: artsyCollectsSalesTax,
        commission_rate: commissionRate,
        commerce_enabled: commerceEnabled,
        criteo_eligible: criteoEligible,
        contract_type: contractType,
        directly_contactable: directlyContactable,
        display_artists_section: displayArtistsSection,
        display_name: displayName,
        display_works_section: displayWorksSection,
        distinguish_represented_artists: distinguishRepresentedArtists,
        email: email,
        enable_ach_payment_method: enableAchPaymentMethod,
        enforce_on_platform_transactions: enforceOnPlatformTransactions,
        featured_keywords: featuredKeywords,
        given_name: givenName,
        has_full_profile: hasFullProfile,
        has_limited_folio_access: hasLimitedFolioAccess,
        implicit_offer_enabled: implicitOfferEnabled,
        inquiry_order_enabled: inquiryOrderEnabled,
        managed_by_erp: managedByErp,
        outreach_admin_id: outreachAdminId,
        partner_categories: partnerCategories,
        pre_qualify: preQualify,
        profile_artists_layout: profileArtistsLayout,
        profile_banner_display: profileBannerDisplay,
        referral_contact_id: referralContactId,
        region: region,
        relative_size: relativeSize,
        requires_merchant_account: requiresMerchantAccount,
        short_name: shortName,
        sortable_name: sortableName,
        type: type,
        vat_number: vatNumber,
        vat_status: vatStatus,
        vat_exempt_approved: vatExemptApproved,
        verified_seller: verifiedSeller,
        website: website,
        wire_transfer_enabled: wireTransferEnabled,
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
