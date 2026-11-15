import { GraphQLEnumType } from "graphql"

export const ArtworkSearchProfileType = new GraphQLEnumType({
  name: "ArtworkSearchProfile",
  values: {
    DEFAULT: { value: "default" },
    PARTNER_INVENTORY: {
      value: "partner",
      description:
        "Inventory search for a partner. Requires partnerID and partner access; ignored otherwise.",
    },
  },
})
