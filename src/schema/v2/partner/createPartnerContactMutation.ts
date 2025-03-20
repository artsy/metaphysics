import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

// Check whats required and whats optional
interface Input {
  partnerID: string
  name?: string
  position?: string
  canContact?: boolean
  email?: string
  emailConfirmation?: string
  phone?: string
  locationID?: string
}

const CreatePartnerContactMutationResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreatePartnerContactResponse",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    position: { type: GraphQLString },
    canContact: { type: GraphQLBoolean },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    locationID: { type: GraphQLString },
  }),
})

export const createPartnerContactMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "createPartnerContact",
  description: "Creates a new contact for a partner",
  inputFields: {
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
    // Do we need this? is it persisted in the database? What does volt use to read it
    emailConfirmation: {
      type: GraphQLString,
      description: "Confirmation of the email address",
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
    partnerContact: {
      type: CreatePartnerContactMutationResponseType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      partnerID,
      name,
      position,
      canContact,
      email,
      emailConfirmation,
      phone,
      locationID,
    },
    { createPartnerContactLoader }
  ) => {
    if (!createPartnerContactLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerContactLoader(partnerID, {
        name,
        position,
        can_contact: canContact,
        email,
        email_confirmation: emailConfirmation,
        phone,
        partner_location_id: locationID,
      })

      return response
    } catch (error) {
      throw new Error(`Failed to create partner contact: ${error.message}`)
    }
  },
})
