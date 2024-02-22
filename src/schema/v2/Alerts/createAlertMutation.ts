import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { AlertInputFields, AlertType, resolveAlertFromJSON } from "./"
import { meType } from "../me"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateAlertSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    alert: {
      type: AlertType,
      resolve: resolveAlertFromJSON,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateAlertFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateAlertResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createAlertMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "createAlert",
  description: "Create an alert",
  inputFields: {
    artistIDs: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
    },
    ...AlertInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { meCreateAlertLoader }) => {
    if (!meCreateAlertLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const settingsArgs = {
        name: args.settings?.name,
        email: args.settings?.email,
        push: args.settings?.push,
        details: args.settings?.details,
        frequency: args.settings?.frequency,
      }

      const gravityArgs = {
        attributes: {
          acquireable: args.acquireable,
          additional_gene_ids: args.additionalGeneIDs,
          artist_ids: args.artistIDs,
          artist_series_ids: args.artistSeriesIDs,
          at_auction: args.atAuction,
          attribution_class: args.attributionClass,
          colors: args.colors,
          dimension_range: args.dimensionRange,
          height: args.height,
          inquireable_only: args.inquireableOnly,
          keyword: args.keyword,
          location_cities: args.locationCities,
          major_periods: args.majorPeriods,
          materials_terms: args.materialsTerms,
          offerable: args.offerable,
          partner_ids: args.partnerIDs,
          price_range: args.priceRange,
          sizes: args.sizes,
          width: args.width,
        },
        user_alert_settings: settingsArgs,
      }

      const response = await meCreateAlertLoader(gravityArgs)

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
