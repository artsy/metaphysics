import { IDFields } from "./object_identification"

import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"

const ExternalPartnerType = new GraphQLObjectType({
  name: "ExternalPartner",
  fields: () => ({
    ...IDFields,
    city: {
      type: GraphQLString,
      resolve: ({ city }) => city,
    },
    name: {
      type: GraphQLString,
      resolve: ({ name }) => name.trim(),
    },
  }),
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
  resolve: (root, { id }, request, { rootValue: { galaxyGalleriesLoader } }) => galaxyGalleriesLoader(id),
}

export default ExternalPartner
