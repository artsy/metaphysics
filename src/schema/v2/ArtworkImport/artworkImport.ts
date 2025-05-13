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
    MISSING_TITLE: { value: "missing_title" },
    MISSING_ARTIST: { value: "missing_artist" },
    MISSING_PRICE: { value: "missing_price" },
    MISSING_DATE: { value: "missing_date" },
    INVALID_PRICE: { value: "invalid_price" },
    INVALID_HEIGHT: { value: "invalid_height" },
    INVALID_WIDTH: { value: "invalid_width" },
    INVALID_DEPTH: { value: "invalid_depth" },
    INVALID_DIAMETER: { value: "invalid_diameter" },
    INVALID_MEDIUM: { value: "invalid_medium" },
    UNMATCHED_IMAGE: { value: "unmatched_image" },
    ARTWORK_CREATION_FAILED: { value: "artwork_creation_failed" },
    UNMATCHED_ARTIST: { value: "unmatched_artist" },
    INVALID_CERTIFICATE_OF_AUTHENTICITY: {
      value: "invalid_coa",
    },
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

const ArtworkImportRowDataType = new GraphQLObjectType({
  name: "ArtworkImportRowData",
  fields: {
    artistNames: {
      type: GraphQLString,
    },
    artworkTitle: {
      type: GraphQLString,
    },
    date: {
      type: GraphQLString,
    },
    depth: {
      type: GraphQLString,
    },
    diameter: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLString,
    },
    imageFileNames: {
      type: GraphQLString,
    },
    inventoryId: {
      type: GraphQLString,
    },
    materials: {
      type: GraphQLString,
    },
    price: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    certificateOfAuthenticity: {
      type: GraphQLString,
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
      type: new GraphQLNonNull(ArtworkImportRowDataType),
      resolve: ({ raw_data, rawDataMapping }) => {
        return {
          artistNames: raw_data[rawDataMapping["ArtistNames"]],
          artworkTitle: raw_data[rawDataMapping["ArtworkTitle"]],
          date: raw_data[rawDataMapping["Date"]],
          depth: raw_data[rawDataMapping["Depth"]],
          diameter: raw_data[rawDataMapping["Diameter"]],
          height: raw_data[rawDataMapping["Height"]],
          imageFileNames: raw_data[rawDataMapping["ImageFileNames"]],
          inventoryId: raw_data[rawDataMapping["Inventory ID"]],
          materials: raw_data[rawDataMapping["Materials"]],
          price: raw_data[rawDataMapping["Price"]],
          width: raw_data[rawDataMapping["Width"]],
          medium: raw_data[rawDataMapping["Medium"]],
          certificateOfAuthenticity:
            raw_data[rawDataMapping["CertificateOfAuthenticity"]],
        }
      },
    },
    transformedData: {
      type: new GraphQLNonNull(ArtworkImportRowDataType),
      resolve: ({ transformed_data }) => {
        return {
          artistNames: transformed_data.ArtistNames,
          artworkTitle: transformed_data.ArtworkTitle,
          date: transformed_data.Date,
          depth: transformed_data.Depth,
          diameter: transformed_data.Diameter,
          height: transformed_data.Height,
          imageFileNames: transformed_data.ImageFileNames,
          inventoryId: transformed_data["Inventory ID"],
          materials: transformed_data.Materials,
          price: transformed_data.Price,
          width: transformed_data.Width,
          medium: transformed_data.Medium,
          certificateOfAuthenticity: transformed_data.CertificateOfAuthenticity,
        }
      },
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
      type: GraphQLString,
    },
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ file_name }) => file_name,
    },
    state: {
      type: ArtworkImportStateType,
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
      resolve: async (
        { id, currency, raw_data_mapping },
        args,
        { artworkImportRowsLoader }
      ) => {
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
          body: body.map((row) => ({
            ...row,
            currency,
            rawDataMapping: raw_data_mapping,
          })),
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
