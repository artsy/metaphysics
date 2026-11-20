import { GraphQLEnumType } from "graphql"

export const ArtworkSearchProfileType = new GraphQLEnumType({
  name: "ArtworkSearchProfile",
  values: {
    DEFAULT: { value: "default" },
    PARTNER_INVENTORY: {
      value: "partner",
      description:
        "Inventory search for a partner, matching the catalog medium. Requires partnerID and partner access; ignored otherwise.",
    },
    PARTNER_CMS: {
      value: "partner_cms",
      description:
        "Inventory search for a partner, matching the medium type instead of the catalog medium. Requires partnerID and partner access; ignored otherwise.",
    },
  },
})
