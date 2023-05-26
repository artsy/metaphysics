import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { HeroUnitType } from "./HeroUnitType"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  body: string
  credit?: string
  endAt?: string
  id: string
  imageUrl?: string
  label?: string
  link: {
    text: string
    url: string
  }
  position?: number
  startAt?: string
  title: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateHeroUnitSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    heroUnit: {
      type: HeroUnitType,
      resolve: (heroUnit) => heroUnit,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateHeroUnitFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "updateHeroUnitResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateHeroUnitMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateHeroUnitMutation",
  description: "updates a hero unit.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: new GraphQLNonNull(GraphQLString) },
    credit: { type: GraphQLString },
    endAt: { type: GraphQLString },
    imageUrl: { type: GraphQLString },
    label: { type: GraphQLString },
    link: {
      type: new GraphQLNonNull(
        new GraphQLInputObjectType({
          name: "UpdateHeroUnitLinkInput",
          fields: {
            text: { type: new GraphQLNonNull(GraphQLString) },
            url: { type: new GraphQLNonNull(GraphQLString) },
          },
        })
      ),
    },
    position: { type: GraphQLInt },
    startAt: { type: GraphQLString },
    title: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    heroUnitOrError: {
      type: ResponseOrErrorType,
      description: "On success: the hero unit updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      body,
      credit,
      endAt,
      id,
      imageUrl,
      label,
      link,
      position,
      startAt,
      title,
    },
    { updateHeroUnitLoader }
  ) => {
    if (!updateHeroUnitLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await updateHeroUnitLoader(id, {
        body,
        credit,
        end_at: endAt,
        image_attributes: { image_url: imageUrl },
        label,
        link_text: link.text,
        link_url: link.url,
        position,
        start_at: startAt,
        title,
      })
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
