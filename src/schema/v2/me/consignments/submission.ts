import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLID,
} from "graphql"
import { NullableIDField } from "schema/v2/object_identification"
import Artist from "schema/v2/artist"
import { ResolverContext } from "types/graphql"

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

export const SubmissionStateAggregation = new GraphQLEnumType({
  name: "SubmissionStateAggregation",
  values: {
    DRAFT: {
      value: "draft",
    },
    SUBMITTED: {
      value: "submitted",
    },
    APPROVED: {
      value: "approved",
    },
    REJECTED: {
      value: "rejected",
    },
  },
})

export const SubmissionType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConsignmentSubmission",
  description: "A work to be consigned to the user",
  fields: {
    ...NullableIDField,
    artistID: {
      description: "The gravity ID for an Artist",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artist_id }) => artist_id,
    },
    authenticityCertificate: {
      description: "Does the artwork come with an certificate of authenticity?",
      type: GraphQLBoolean,
      resolve: ({ authenticity_certificate }) => authenticity_certificate,
    },
    category: {
      description: "The set in which to put the work",
      type: SubmissionCategoryAggregation,
    },
    depth: {
      description: "The depth of the work",
      type: GraphQLString,
    },
    dimensionsMetric: {
      description: "A string, either CM or IN",
      type: SubmissionDimensionAggregation,
      resolve: ({ dimensions_metric }) => dimensions_metric,
    },
    edition: {
      description: "Is the work a part of an edition",
      type: GraphQLBoolean,
    },
    editionNumber: {
      description: "The number of the individual work if in a set",
      type: GraphQLString,
      resolve: ({ edition_number }) => edition_number,
    },
    editionSize: {
      description: "The whole size of the set of works",
      type: GraphQLInt,
      resolve: ({ edition_size }) => edition_size,
    },
    height: {
      description: "The height of the work",
      type: GraphQLString,
    },
    locationCity: {
      description: "The city where the work currently resides",
      type: GraphQLString,
      resolve: ({ location_city }) => location_city,
    },
    locationCountry: {
      description: "The country where the work currently resides",
      type: GraphQLString,
      resolve: ({ location_country }) => location_country,
    },
    locationState: {
      description: "The state where the work currently resides",
      type: GraphQLString,
      resolve: ({ location_state }) => location_state,
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
    state: {
      description: "The internal state of the work, e.g. draft/submitted",
      type: SubmissionStateAggregation,
    },
    width: {
      description: "The width of the work",
      type: GraphQLString,
    },
    year: {
      description: "The year the work was created",
      type: GraphQLString,
    },
    userID: {
      description: "The user who submitted the work",
      type: GraphQLID,
      resolve: ({ user_id }) => user_id,
    },
    artist: {
      type: Artist.type,
      resolve: ({ artist_id }, _args, { artistLoader }) => {
        if (!artist_id) return null
        return artistLoader(artist_id).catch(() => null)
      },
    },
  },
})

// There is no need to support reading yet,
// and so this file has no default export
// to handle resolving.
