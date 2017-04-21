import { GraphQLEnumType } from "graphql"

export default new GraphQLEnumType({
  name: "PartnerClassification",
  values: {
    AUCTION: {
      value: "PartnerAuction",
    },
    BRAND: {
      value: "PartnerBrand",
    },
    DEMO: {
      value: "PartnerDemo",
    },
    GALLERY: {
      value: "PartnerGallery",
    },
    INSTITUTION: {
      value: "PartnerInstitution",
    },
    INSTITUTIONAL_SELLER: {
      value: "PartnerInstitutionalSeller",
    },
    PRIVATE_COLLECTOR: {
      value: "PartnerPrivateCollector",
    },
    PRIVATE_DEALER: {
      value: "PartnerPrivateDealer",
    },
  },
})
