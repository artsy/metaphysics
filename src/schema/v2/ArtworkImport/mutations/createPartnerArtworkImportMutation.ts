import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "../artworkImport"

const PartnerConversionMetadataType = new GraphQLInputObjectType({
  name: "PartnerConversionMetadataInput",
  fields: () => ({
    saleSlug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Sale slug for the auction",
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworkImportSuccess",
  isTypeOf: (data) => !!data.id && !data._type,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
    conversionSummary: {
      type: new GraphQLObjectType({
        name: "PartnerConversionSummary",
        fields: {
          partnerTemplateType: { type: GraphQLString },
          originalRowsCount: { type: GraphQLString },
          transformedRowsCount: { type: GraphQLString },
        },
      }),
      resolve: (result) => result.conversion_summary,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreatePartnerArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreatePartnerArtworkImport",
  description:
    "Create an artwork import from a partner spreadsheet with data conversion",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket where the partner file is stored",
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the partner file",
    },
    fileName: {
      type: GraphQLString,
      description: "Name of the partner file",
    },
    locationID: {
      type: GraphQLString,
      description: "ID of the partner location",
    },
    partnerListID: {
      type: GraphQLString,
      description: "ID of the partner list to add artworks to",
    },
    conversionMetadata: {
      type: new GraphQLNonNull(PartnerConversionMetadataType),
      description: "Metadata required for partner data conversion",
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, context) => {
    const { createPartnerArtworkImportLoader } = context

    if (!createPartnerArtworkImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      partner_id: args.partnerID,
      s3_bucket: args.s3Bucket,
      s3_key: args.s3Key,
      file_name: args.fileName,
      location_id: args.locationID,
      partner_list_id: args.partnerListID,
      conversion_metadata: {
        sale_slug: args.conversionMetadata.saleSlug,
      },
    }

    try {
      const result = await createPartnerArtworkImportLoader(gravityArgs)
      return result
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
