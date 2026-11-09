import { GraphQLEnumType } from "graphql"

// Gravity's `search_profile` param. Only "partner" changes anything, and Gravity
// honours it only for a request scoped to one partner the caller can manage.
// Kept in its own module so both filterArtworksConnection and the partner match
// connections can import it without a circular import.
export const PARTNER_INVENTORY_SEARCH_PROFILE = "partner"

export const ArtworkSearchProfileType = new GraphQLEnumType({
  name: "ArtworkSearchProfile",
  values: {
    DEFAULT: { value: "default" },
    PARTNER_INVENTORY: {
      value: PARTNER_INVENTORY_SEARCH_PROFILE,
      description:
        "Inventory search for a partner. Requires partnerID and partner access; ignored otherwise.",
    },
  },
})
