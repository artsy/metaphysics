import { GraphQLEnumType, GraphQLObjectType } from "graphql"

// known standard component types

const HomeViewComponentTypeType = new GraphQLEnumType({
  name: "HomeViewComponentType",
  description: "Known component types for use in home view",
  values: {
    ARTWORKS_RAIL: {
      value: "ArtworksRail",
      description: "A standard rail of artworks",
    },
    ARTISTS_RAIL: {
      value: "ArtistsRail",
      description: "A standard rail of artists",
    },
  },
})

// a component spec, to be prescribed by each section

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    type: {
      type: HomeViewComponentTypeType,
      description: "Which component type to render",
    },
  },
})
