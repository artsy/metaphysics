import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean, GraphQLEnumType } from "graphql"

export const SubmissionDimensionAggregation = new GraphQLEnumType({
  name: "SubmissionDimensionAggregation",
  values: {
    CM: {
      value: "cm",
    },
    IN: {
      value: "in",
    },
  },
})

export const SubmissionCategoryAggregation = new GraphQLEnumType({
  name: "SubmissionCategoryAggregation",
  values: {
    PAINTING: {
      value: "Painting",
    },
    SCULPTURE: {
      value: "Sculpture",
    },
    PHOTOGRAPHY: {
      value: "Photography",
    },
    PRINT: {
      value: "Print",
    },
    DRAWING_COLLAGE_OR_OTHER_WORK_ON_PAPER: {
      value: "Drawing, Collage or other Work on Paper",
    },
    MIXED_MEDIA: {
      value: "Mixed Media",
    },
    PERFORMANCE_ART: {
      value: "Performance Art",
    },
    INSTALLATION: {
      value: "Installation",
    },
    VIDEO_FILM_ANIMATION: {
      value: "Video/Film/Animation",
    },
    ARCHITECTURE: {
      value: "Architecture",
    },
    FASHION_DESIGN_AND_WEARABLE_ART: {
      value: "Fashion Design and Wearable Art",
    },
    JEWELRY: {
      value: "Jewelry",
    },
    DESIGN_DECORATIVE_ART: {
      value: "Design/Decorative Art",
    },
    TEXTILE_ARTS: {
      value: "Textile Arts",
    },
    OTHER: {
      value: "Other",
    },
  },
})

export const SubmissionType = new GraphQLObjectType({
  name: "Submission",
  description: "A work to be consigned to the user",
  fields: {
    id: {
      description: "Convection id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    artist_id: {
      decription: "The gravity ID for an Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
    authenticity_certificate: {
      description: "Does the artwork come with an certificate of authenticity?",
      type: GraphQLBoolean,
    },
    category: {
      description: "The set in which to put the work",
      type: SubmissionCategoryAggregation,
    },
    depth: {
      description: "The depth of the work",
      type: GraphQLString,
    },
    dimensions_metric: {
      description: "A string, either CM or IN",
      type: SubmissionDimensionAggregation,
    },
    edition: {
      description: "The version of individual work if from a set",
      type: GraphQLString,
    },
    edition_number: {
      description: "The number of the individual work if in a set",
      type: GraphQLString,
    },
    edition_size: {
      description: "The whole size of the set of works",
      type: GraphQLString,
    },
    height: {
      description: "The height of the work",
      type: GraphQLString,
    },
    location_city: {
      description: "The city where the work currently resides",
      type: GraphQLString,
    },
    location_country: {
      description: "The country where the work currently resides",
      type: GraphQLString,
    },
    location_state: {
      description: "The state where the work currently resides",
      type: GraphQLString,
    },
    medium: {
      description: "The materials in which the work is created",
      type: GraphQLString,
    },
    provenance: {
      description: "The history of an work",
      type: GraphQLString,
    },
    signature: {
      description: "Is this work signed?",
      type: GraphQLBoolean,
    },
    title: {
      description: "The name of the work",
      type: GraphQLString,
    },
    width: {
      description: "The width of the work",
      type: GraphQLString,
    },
    year: {
      description: "The year the work was created",
      type: GraphQLString,
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
