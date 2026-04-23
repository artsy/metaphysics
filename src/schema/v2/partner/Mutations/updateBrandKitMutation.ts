import {
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
import { BrandKitType } from "../brandKit"

interface Input {
  id: string
  textColor?: string
  backgroundColor?: string
  ctaColor?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateBrandKitSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    brandKit: {
      type: BrandKitType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateBrandKitFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateBrandKitResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "UpdateBrandKitFailure"
    }
    return "UpdateBrandKitSuccess"
  },
})

export const updateBrandKitMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateBrandKit",
  description: "Update a partner's brand kit",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the brand kit to update",
    },
    textColor: {
      type: GraphQLString,
      description: "Text color hex code (e.g. #FF0000)",
    },
    backgroundColor: {
      type: GraphQLString,
      description: "Background color hex code (e.g. #FF0000)",
    },
    ctaColor: {
      type: GraphQLString,
      description: "CTA color hex code (e.g. #FF0000)",
    },
    fontFamily: {
      type: GraphQLString,
      description: "Font family name",
    },
    fontWeight: {
      type: GraphQLString,
      description: "Font weight",
    },
    fontStyle: {
      type: GraphQLString,
      description: "Font style",
    },
  },
  outputFields: {
    brandKitOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated brand kit",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      textColor,
      backgroundColor,
      ctaColor,
      fontFamily,
      fontWeight,
      fontStyle,
    },
    { updateBrandKitLoader }
  ) => {
    if (!updateBrandKitLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateBrandKitLoader(id, {
        text_color: textColor,
        background_color: backgroundColor,
        cta_color: ctaColor,
        font_family: fontFamily,
        font_weight: fontWeight,
        font_style: fontStyle,
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
