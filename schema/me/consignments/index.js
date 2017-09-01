import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLUnionType,
} from "graphql"

export const ConsignmentType = new GraphQLObjectType({
  name: "Consignment",
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
      description: "",
      type: GraphQLString,
    },
    category: {
      description: "",
      type: GraphQLString,
    },
    deadline_to_sell: {
      description: "",
      type: GraphQLString,
    },
    depth: {
      description: "",
      type: GraphQLString,
    },
    dimensions_metric: {
      description: "",
      type: GraphQLString,
    },
    edition: {
      description: "",
      type: GraphQLString,
    },
    edition_number: {
      description: "",
      type: GraphQLString,
    },
    edition_size: {
      description: "",
      type: GraphQLString,
    },
    height: {
      description: "",
      type: GraphQLString,
    },
    location_city: {
      description: "",
      type: GraphQLString,
    },
    location_country: {
      description: "",
      type: GraphQLString,
    },
    location_state: {
      description: "",
      type: GraphQLString,
    },
    medium: {
      description: "",
      type: GraphQLString,
    },
    provenance: {
      description: "",
      type: GraphQLString,
    },
    signature: {
      description: "",
      type: GraphQLString,
    },
    state: {
      description: "",
      type: GraphQLString,
    },
    title: {
      description: "",
      type: GraphQLString,
    },
    width: {
      description: "",
      type: GraphQLString,
    },
    yea: {
      description: "",
      type: GraphQLString,
    },
  },
})

export default {
  type: ConsignmentType,
  description: "A consignment, usually between a user and a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
  },
  resolve: (root, { id }, request, { rootValue: { conversationLoader } }) => {
    if (!conversationLoader) return null
    return conversationLoader(id)
  },
}
