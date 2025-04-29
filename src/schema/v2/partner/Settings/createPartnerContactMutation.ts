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
import { ResolverContext } from "types/graphql"
import { ContactType } from "../../Contacts"

interface Input {
  partnerID: string
  name?: string
  position?: string
  canContact?: boolean
  email?: string
  phone?: string
  locationId?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerContactSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    partnerContact: {
      type: ContactType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerContactFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerContactOrError",
  types: [SuccessType, FailureType],
})

export const CreatePartnerContactMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerContact",
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
    phone: {
      type: GraphQLString,
      description: "Phone number of the contact",
    },
    locationId: {
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
    { partnerID, name, position, canContact, email, phone, locationId },
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
        phone,
        partner_location_id: locationId,
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
