import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  SmsSecondFactorMutationResponseOrErrorsType,
  SmsSecondFactorAttributes,
} from "../secondFactors"
import { ResolverContext } from "types/graphql"

export const updateSmsSecondFactorMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateSmsSecondFactor",
  inputFields: {
    secondFactorID: {
      type: new GraphQLNonNull(GraphQLID),
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
    { attributes, secondFactorID },
    { updateSecondFactorLoader }
  ) => {
    if (!updateSecondFactorLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const snakeCaseAttributes = {
        country_code: attributes.countryCode,
        phone_number: attributes.phoneNumber,
      }

      return await updateSecondFactorLoader(secondFactorID, {
        kind: "sms",
        attributes: snakeCaseAttributes,
      })
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
