import { GraphQLEnumType } from 'graphql';

export default new GraphQLEnumType({
  name: 'PartnerClassification',
  values: {
    AUCTION: {
      value: 'PartnerAuction',
    },
    DEMO: {
      value: 'PartnerDemo',
    },
    GALLERY: {
      value: 'PartnerGallery',
    },
    PRIVATE_COLLECTOR: {
      value: 'PartnerPrivateCollector',
    },
    PRIVATE_DEALER: {
      value: 'PartnerPrivateDealer',
    },
    INSTITUTION: {
      value: 'PartnerInstitution',
    },
    INSTITUTIONAL_SELLER: {
      value: 'PartnerInstitutionalSeller',
    },
    BRAND: {
      value: 'PartnerBrand',
    },
  },
});
