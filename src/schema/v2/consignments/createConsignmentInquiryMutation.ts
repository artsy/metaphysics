import {
  GraphQLInt,
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
import { camelCase } from "lodash"
import { ResolverContext } from "types/graphql"

const ConsignmentInquiryType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConsignmentInquiry",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "id of the ConsignmentInquiry",
    },
    userId: {
      type: GraphQLString,
      description: "gravity user id if user is logged in",
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Email of inquirer",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the inquirer",
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Message of the inquirer",
    },
    phoneNumber: {
      type: GraphQLString,
      description: "Phone number of the inquirer",
    },
  }),
})

const MutationSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConsignmentInquiryMutationSuccess",
  isTypeOf: (data) => {
    return data._type !== "GravityMutationError"
  },
  fields: () => ({
    consignmentInquiry: {
      type: ConsignmentInquiryType,
      resolve: (consignmentInquiry) => {
        const result = {}
        const { gravity_user_id, ...otherFields } = consignmentInquiry
        const keys = Object.keys(otherFields)
        keys.forEach((key) => {
          result[camelCase(key)] = consignmentInquiry[key]
        })
        result["userId"] = consignmentInquiry.gravity_user_id ?? null
        return result
      },
    },
  }),
})

const MutationFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConsignmentInquiryMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const CreateConsignmentInquiryMutationType = new GraphQLUnionType({
  name: "CreateConsignmentInquiryMutationType",
  types: [MutationSuccessType, MutationFailureType],
})

export const createConsignmentInquiryMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateConsignmentInquiryMutation",
  description: "Make inquiry about consignments",
  inputFields: {
    userId: {
      type: GraphQLString,
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    phoneNumber: {
      type: GraphQLString,
    },
  },
  outputFields: {
    consignmentInquiryOrError: {
      type: CreateConsignmentInquiryMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { name, email, userId, phoneNumber, message },
    { createConsignmentInquiryLoader }
  ) => {
    if (!createConsignmentInquiryLoader) {
      throw new Error("No createConsignmentInquiryLoader found!")
    }

    return createConsignmentInquiryLoader({
      name,
      email,
      gravity_user_id: userId,
      message,
      phone_number: phoneNumber,
    })
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
