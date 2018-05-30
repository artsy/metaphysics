import { IDFields } from "./object_identification"

import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"

const ExternalPartnerType = new GraphQLObjectType({
  name: "ExternalPartner",
  fields: () => {return {
    ...IDFields,
    city: {
      type: GraphQLString,
      resolve: ({ city }) => {return city},
    },
    name: {
      type: GraphQLString,
      resolve: ({ name }) => {return name.trim()},
    },
  }},
})

const ExternalPartner = {
  type: ExternalPartnerType,
  description: "An External Partner not on the platform",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Partner",
    },
  },
  resolve: (root, { id }, request, { rootValue: { galaxyGalleriesLoader } }) =>
    {return galaxyGalleriesLoader(id)},
}

export default ExternalPartner
