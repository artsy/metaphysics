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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateAlertSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    alert: {
      type: AlertType,
      resolve: resolveAlertFromJSON,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateAlertFailure",
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
  name: "UpdateAlertResponseOrError",
  types: [SuccessType, ErrorType],
})

export const updateAlertMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "updateAlert",
  description: "Create an alert",
  inputFields: {
    artistIDs: {
      type: new GraphQLList(GraphQLString),
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ...AlertInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, ...args }, { meUpdateAlertLoader }) => {
    if (!meUpdateAlertLoader) {
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

      const response = await meUpdateAlertLoader(id, gravityArgs)

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
