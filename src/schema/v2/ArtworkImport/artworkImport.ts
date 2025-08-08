import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLList,
  GraphQLEnumType,
} from "graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import GraphQLJSON from "graphql-type-json"
import { ArtistType } from "../artist"
import { ArtworkType } from "../artwork"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"
import { date } from "schema/v2/fields/date"

export const ArtworkImportErrorType = new GraphQLEnumType({
  name: "ArtworkImportError",
  values: {
    // MISSING
    MISSING_TITLE: { value: "missing_title" },
    MISSING_ARTIST: { value: "missing_artist" },
    MISSING_PRICE: { value: "missing_price" },
    MISSING_DATE: { value: "missing_date" },

    // INVALID
    INVALID_TITLE: { value: "invalid_title" },
    INVALID_PRICE: { value: "invalid_price" },
    INVALID_HEIGHT: { value: "invalid_height" },
    INVALID_WIDTH: { value: "invalid_width" },
    INVALID_DEPTH: { value: "invalid_depth" },
    INVALID_DIAMETER: { value: "invalid_diameter" },
    INVALID_MEDIUM: { value: "invalid_medium" },
    INVALID_FRAMED_HEIGHT: { value: "invalid_framed_height" },
    INVALID_FRAMED_WIDTH: { value: "invalid_framed_width" },
    INVALID_FRAMED_DEPTH: { value: "invalid_framed_depth" },
    INVALID_FRAMED_DIAMETER: { value: "invalid_framed_diameter" },
    INVALID_CERTIFICATE_OF_AUTHENTICITY: {
      value: "invalid_certificate_of_authenticity",
    },
    INVALID_SIGNATURE: { value: "invalid_signature" },
    INVALID_CLASSIFICATION: { value: "invalid_classification" },
    INVALID_WEIGHT: { value: "invalid_weight" },

    // OTHER
    UNMATCHED_IMAGE: { value: "unmatched_image" },
    UNMATCHED_ARTIST: { value: "unmatched_artist" },
    ARTWORK_CREATION_FAILED: { value: "artwork_creation_failed" },
  },
})

export const ArtworkImportStateType = new GraphQLEnumType({
  name: "ArtworkImportState",
  values: {
    PENDING: { value: "pending" },
    ARTIST_MATCHING_COMPLETE: { value: "artist_matching_complete" },
    ARTWORKS_CREATION_COMPLETE: { value: "artworks_creation_complete" },
    CANCELED: { value: "canceled" },
  },
})

const ArtworkImportCreatedBy = new GraphQLObjectType({
  name: "ArtworkImportCreatedBy",
  fields: {
    ...InternalIDFields,
    name: {
      type: GraphQLString,
      resolve: ({ name }) => name,
    },
  },
})

const ArtworkImportSummaryType = new GraphQLObjectType({
  name: "ArtworkImportSummary",
  fields: {
    currencies: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: ({ currencies_found }) => currencies_found,
    },
    dimensionMetrics: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: ({ dimension_metrics_found }) => dimension_metrics_found,
    },
    weightMetrics: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: ({ weight_metrics_found }) => weight_metrics_found,
    },
  },
})

const ArtworkImportRowErrorType = new GraphQLObjectType({
  name: "ArtworkImportRowError",
  fields: {
    ...InternalIDFields,
    errorType: {
      type: ArtworkImportErrorType,
      resolve: ({ error_type }) => error_type,
    },
    metadata: {
      type: GraphQLJSON,
    },
    blocking: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

const ArtworkImportRowImageType = new GraphQLObjectType({
  name: "ArtworkImportRowImage",
  fields: {
    ...InternalIDFields,
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    s3Key: {
      type: GraphQLString,
      resolve: ({ s3_key }) => s3_key,
    },
    s3Bucket: {
      type: GraphQLString,
      resolve: ({ s3_bucket }) => s3_bucket,
    },
  },
})

const ArtworkImportRowType = new GraphQLObjectType({
  name: "ArtworkImportRow",
  fields: {
    ...InternalIDFields,
    artwork: {
      type: ArtworkType,
    },
    artists: {
      type: new GraphQLList(new GraphQLNonNull(ArtistType)),
    },
    currency: {
      type: new GraphQLNonNull(GraphQLString),
    },
    dimensionMetric: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ dimension_metric }) => dimension_metric,
    },
    weightMetric: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ weight_metric }) => weight_metric,
    },
    priceListed: {
      type: Money,
      resolve: (
        { price_minor: minor, currency: currencyCode },
        args,
        context,
        info
      ) => {
        if (!minor || !currencyCode) {
          return null
        }

        return resolveMinorAndCurrencyFieldsToMoney(
          {
            minor,
            currencyCode,
          },
          args,
          context,
          info
        )
      },
    },
    rawData: {
      type: new GraphQLNonNull(GraphQLJSON),
      resolve: ({ raw_data }) => raw_data,
    },
    transformedData: {
      type: new GraphQLNonNull(
        new GraphQLObjectType<any, ResolverContext>({
          name: "ArtworkImportTransformedData",
          fields: {
            artistNames: {
              type: GraphQLString,
              resolve: ({ ArtistNames }) => ArtistNames,
            },
            artworkTitle: {
              type: GraphQLString,
              resolve: ({ ArtworkTitle }) => ArtworkTitle,
            },
            date: {
              type: GraphQLString,
              resolve: ({ Date }) => Date,
            },
            depth: {
              type: GraphQLString,
              resolve: ({ Depth }) => Depth,
            },
            diameter: {
              type: GraphQLString,
              resolve: ({ Diameter }) => Diameter,
            },
            height: {
              type: GraphQLString,
              resolve: ({ Height }) => Height,
            },
            imageFileNames: {
              type: GraphQLString,
              resolve: ({ ImageFileNames }) => ImageFileNames,
            },
            inventoryId: {
              type: GraphQLString,
              resolve: (data) => data["Inventory ID"],
            },
            materials: {
              type: GraphQLString,
              resolve: ({ Materials }) => Materials,
            },
            price: {
              type: GraphQLString,
              resolve: ({ Price }) => Price,
            },
            width: {
              type: GraphQLString,
              resolve: ({ Width }) => Width,
            },
            medium: {
              type: GraphQLString,
              resolve: ({ Medium }) => Medium,
            },
            certificateOfAuthenticity: {
              type: GraphQLString,
              resolve: ({ CertificateOfAuthenticity }) =>
                CertificateOfAuthenticity,
            },
            signature: {
              type: new GraphQLList(GraphQLString),
              resolve: ({ Signature }) => Signature,
            },
            signatureDetails: {
              type: GraphQLString,
              resolve: ({ SignatureDetails }) => SignatureDetails,
            },
            artworkCondition: {
              type: GraphQLString,
              resolve: ({ ArtworkCondition }) => ArtworkCondition,
            },
            framedHeight: {
              type: GraphQLString,
              resolve: ({ FramedHeight }) => FramedHeight,
            },
            framedWidth: {
              type: GraphQLString,
              resolve: ({ FramedWidth }) => FramedWidth,
            },
            framedDepth: {
              type: GraphQLString,
              resolve: ({ FramedDepth }) => FramedDepth,
            },
            framedDiameter: {
              type: GraphQLString,
              resolve: ({ FramedDiameter }) => FramedDiameter,
            },
            classification: {
              type: GraphQLString,
              resolve: ({ Classification }) => Classification,
            },
            weight: {
              type: GraphQLString,
              resolve: ({ Weight }) => Weight,
            },
          },
        })
      ),
      resolve: ({ transformed_data }) => transformed_data,
    },
    errors: {
      type: new GraphQLNonNull(
        GraphQLList(new GraphQLNonNull(ArtworkImportRowErrorType))
      ),
      resolve: ({ artwork_import_row_errors }) => artwork_import_row_errors,
    },
    images: {
      type: new GraphQLNonNull(
        GraphQLList(new GraphQLNonNull(ArtworkImportRowImageType))
      ),
      resolve: ({ artwork_import_row_images }) => artwork_import_row_images,
    },
    excludedFromImport: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ excluded_from_import }) => excluded_from_import,
    },
  },
})

const ArtworkImportRowConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkImportRowType,
}).connectionType

export const ArtworkImportType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkImport",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    columns: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      description:
        "Columns to display for an import, will exist in a row's `transformedData`",
    },
    createdAt: date(),
    createdBy: {
      type: ArtworkImportCreatedBy,
      resolve: ({ created_by }) => created_by,
    },
    currency: {
      type: new GraphQLNonNull(GraphQLString),
    },
    dimensionMetric: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ dimension_metric }) => dimension_metric,
    },
    weightMetric: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ weight_metric }) => weight_metric,
    },
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    locationID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ location_id }) => location_id,
    },
    state: {
      type: ArtworkImportStateType,
    },
    summary: {
      type: ArtworkImportSummaryType,
      resolve: async ({ id }, _args, { artworkImportSummaryLoader }) => {
        if (!artworkImportSummaryLoader) return null

        return await artworkImportSummaryLoader(id)
      },
    },
    unmatchedArtistNames: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: async (
        { id },
        _args,
        { artworkImportUnmatchedArtistNamesLoader }
      ) => {
        if (!artworkImportUnmatchedArtistNamesLoader) return []

        const {
          unmatched_artist_names,
        } = await artworkImportUnmatchedArtistNamesLoader(id)

        return unmatched_artist_names
      },
    },
    rawDataMapping: {
      type: new GraphQLNonNull(GraphQLJSON),
      resolve: ({ raw_data_mapping }) => raw_data_mapping,
    },
    rowsConnection: {
      type: ArtworkImportRowConnectionType,
      args: pageable({
        hasErrors: {
          type: GraphQLBoolean,
        },
        errorTypes: {
          type: new GraphQLList(ArtworkImportErrorType),
        },
        excludeErrorTypes: {
          type: new GraphQLList(ArtworkImportErrorType),
        },
        blockersOnly: {
          type: GraphQLBoolean,
        },
        createdOnly: {
          type: GraphQLBoolean,
        },
      }),
      resolve: async ({ id }, args, { artworkImportRowsLoader }) => {
        if (!artworkImportRowsLoader) {
          throw new Error(
            "A X-Access-Token header is required to perform this action."
          )
        }

        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const { body, headers } = await artworkImportRowsLoader(id, {
          size,
          offset,
          has_errors: args.hasErrors,
          error_types: args.errorTypes,
          exclude_error_types: args.excludeErrorTypes,
          blockers_only: args.blockersOnly,
          created_only: args.createdOnly,
          total_count: true,
        })

        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          totalCount,
          offset,
          page,
          size,
          body,
          args,
        })
      },
    },
  }),
})

export const ArtworkImport: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkImportType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_parent, { id }, { artworkImportLoader }) => {
    if (!artworkImportLoader) return null

    return artworkImportLoader(id)
  },
}

export const ArtworkImportsConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkImportType,
}).connectionType
