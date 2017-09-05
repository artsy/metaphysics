import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean } from "graphql"

export const SubmissionType = new GraphQLObjectType({
  name: "Submission",
  description: "A work to be consigned to the user",
  fields: {
    id: {
      description: "Convection id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    additional_info: {
      description: "The type of participant, e.g. Partner or User",
      type: GraphQLString,
    },
    artist_id: {
      decription: "The gravity ID for an Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
    authenticity_certificate: {
      description: "Does the artwork come with an certificate of authenticty?",
      type: GraphQLBoolean,
    },
    category: {
      description: "The set in which to put the work",
      type: GraphQLString,
    },
    deadline_to_sell: {
      description: "",
      type: GraphQLString,
    },
    depth: {
      description: "The depth of the work",
      type: GraphQLString,
    },
    dimensions_metric: {
      description: "A string, either CM or IN",
      type: GraphQLString,
    },
    edition: {
      description: "The version of artwork if from a set",
      type: GraphQLString,
    },
    edition_number: {
      description: "The number of the artwork if in a set",
      type: GraphQLString,
    },
    edition_size: {
      description: "The whole size of the set of artworks",
      type: GraphQLString,
    },
    height: {
      description: "The height of the artwork",
      type: GraphQLString,
    },
    location_city: {
      description: "The city where the Artwork currently resides",
      type: GraphQLString,
    },
    location_country: {
      description: "The country where the Artwork currently resides",
      type: GraphQLString,
    },
    location_state: {
      description: "The state where the Artwork currently resides",
      type: GraphQLString,
    },
    medium: {
      description: "The materials in which the artwork is created",
      type: GraphQLString,
    },
    provenance: {
      description: "The history of an artwork",
      type: GraphQLString,
    },
    signature: {
      description: "Is this work signed?",
      type: GraphQLBoolean,
    },
    state: {
      description: "A description of the Artwork's state",
      type: GraphQLString,
    },
    title: {
      description: "The name of the artwork",
      type: GraphQLString,
    },
    width: {
      description: "The width of the artwork",
      type: GraphQLString,
    },
    year: {
      description: "The year the artwork was created",
      type: GraphQLString,
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
