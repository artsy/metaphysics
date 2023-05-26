import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { HeroUnitType } from "./HeroUnitType"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteHeroUnitSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    heroUnit: {
      type: HeroUnitType,
      resolve: (heroUnit) => heroUnit,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteHeroUnitFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteHeroUnitResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteHeroUnitMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteHeroUnitMutation",
  description: "deletes a hero unit.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    heroUnitOrError: {
      type: ResponseOrErrorType,
      description: "On success: the deleted hero unit.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteHeroUnitLoader }) => {
    if (!deleteHeroUnitLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteHeroUnitLoader(id)
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
