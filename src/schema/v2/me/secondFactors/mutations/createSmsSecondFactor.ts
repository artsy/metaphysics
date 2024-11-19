import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  SmsSecondFactorMutationResponseOrErrorsType,
  SmsSecondFactorAttributes,
} from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const createSmsSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateSmsSecondFactor",
  inputFields: {
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
    attributes: {
      type: new GraphQLNonNull(SmsSecondFactorAttributes),
    },
  },
  outputFields: {
    secondFactorOrErrors: {
      type: SmsSecondFactorMutationResponseOrErrorsType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { password, attributes },
    { createSecondFactorLoader }
  ) => {
    if (!createSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const snakeCaseAttributes = {
        country_code: attributes.countryCode,
        phone_number: attributes.phoneNumber,
      }

      const data = await createSecondFactorLoader({
        kind: "sms",
        password,
        attributes: snakeCaseAttributes,
      })

      return data[0]
    } catch (error) {
      const { body } = error
      return {
        errors: [
          {
            message: body.message ?? body.error,
            code: "invalid",
          },
        ],
      }
    }
  },
})
