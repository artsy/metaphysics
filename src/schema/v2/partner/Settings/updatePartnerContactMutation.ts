import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ContactType } from "schema/v2/Contacts"
import { ResolverContext } from "types/graphql"

interface Input {
  contactID: string
  partnerID: string
  name?: string
  position?: string
  canContact?: boolean
  email?: string
  phone?: string
  locationID?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerContactSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerContact: {
      type: ContactType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerContactFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerContactOrError",
  types: [SuccessType, FailureType],
})

export const UpdatePartnerContactMutation = mutationWithClientMutationId<
  Input & { contactID: string },
  any,
  ResolverContext
>({
  name: "UpdatePartnerContact",
  description: "Updates an existing contact for a partner",
  inputFields: {
    contactID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the contact to update",
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    name: {
      type: GraphQLString,
      description: "Contact's name",
    },
    position: {
      type: GraphQLString,
      description: "Contact's position at the partner",
    },
    canContact: {
      type: GraphQLBoolean,
      description:
        "If true, send all user inquiries and order notifications to this contact.",
    },
    email: {
      type: GraphQLString,
      description: "Email address of the contact",
    },
    phone: {
      type: GraphQLString,
      description: "Phone number of the contact",
    },
    locationID: {
      type: GraphQLString,
      description: "ID of the contact's partner location",
    },
  },
  outputFields: {
    partnerContactOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      contactID,
      partnerID,
      name,
      position,
      canContact,
      email,
      phone,
      locationID,
    },
    { updatePartnerContactLoader }
  ) => {
    if (!updatePartnerContactLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerContactLoader(contactID, {
        partner_id: partnerID,
        name,
        position,
        can_contact: canContact,
        email,
        phone,
        partner_location_id: locationID,
      })

      return response
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
