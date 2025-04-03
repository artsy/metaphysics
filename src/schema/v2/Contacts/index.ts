import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { LocationType } from "schema/v2/location"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

export const ContactType = new GraphQLObjectType<any, ResolverContext>({
  name: "Contact",
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name,
      },
      email: {
        type: GraphQLString,
        resolve: ({ email }) => email,
      },
      phone: {
        type: GraphQLString,
        resolve: ({ phone }) => phone,
      },
      position: {
        type: GraphQLString,
        resolve: ({ position }) => position,
      },
      location: {
        type: LocationType,
        resolve: ({ partner_location }) => partner_location,
      },
      canContact: {
        type: GraphQLBoolean,
        resolve: ({ can_contact }) => can_contact,
      },
    }
  },
})

export const contactsConnection = connectionWithCursorInfo({
  nodeType: ContactType,
})
