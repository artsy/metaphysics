import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
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
import { snakeCaseKeys } from "lib/helpers"
import { omitBy, isUndefined } from "lodash"
import { ResolverContext } from "types/graphql"
import { ArtnetEditionSetType } from "./artnetEditionSet"

interface UpdateArtnetEditionSetMutationInputProps {
  id: string
  priceMinor?: number | null
  priceCurrency?: string | null
  saleStatus?: string
  syncPrice?: boolean
  syncAvailability?: boolean
}

const ArtnetSaleStatusType = new GraphQLEnumType({
  name: "ArtnetSaleStatus",
  description:
    "Artnet's own sale-status vocabulary for an edition, including the statuses no Gravity availability maps to.",
  values: {
    FOR_SALE: { value: "For Sale" },
    RESERVED: { value: "Reserved" },
    NOT_AVAILABLE: { value: "Not Available" },
    NOT_FOR_SALE: { value: "Not for Sale" },
    SOLD: { value: "Sold" },
    PRICE_ON_REQUEST: { value: "Price on Request" },
    CONTACT_GALLERY: { value: "Contact Gallery" },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtnetEditionSetSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetEditionSet: {
      type: ArtnetEditionSetType,
      resolve: (artnetEditionSet) => artnetEditionSet,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtnetEditionSetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtnetEditionSetResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtnetEditionSetMutation = mutationWithClientMutationId<
  UpdateArtnetEditionSetMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateArtnetEditionSetMutation",
  description:
    "Sets an Artnet edition's own price or sale status, explicitly or by taking it from the edition's own catalog row, and pushes the artwork's whole edition set to Artnet, since Artnet replaces the set rather than patching one edition of it. At least one of `priceMinor`, `priceCurrency`, `saleStatus`, `syncPrice` or `syncAvailability` is required. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the ArtnetEditionSet.",
    },
    priceMinor: {
      type: GraphQLInt,
      description:
        "Floor of this edition's price on Artnet, in minor units. A price and its currency travel together: pass both to set one, and both as null to hand the field back, after which the edition takes the inventory row's price again. Omit to leave it unchanged.",
    },
    priceCurrency: {
      type: GraphQLString,
      description:
        "ISO currency for this edition's price, stored as Artnet's own code (CNY becomes RMB).",
    },
    saleStatus: {
      type: ArtnetSaleStatusType,
      description:
        "Artnet's own sale status name. Includes the statuses no Gravity availability maps to (Not Available, Price on Request, Contact Gallery), which is the only way to set one.",
    },
    syncPrice: {
      type: GraphQLBoolean,
      description:
        "Take this edition's price from its own catalog edition set instead of passing `priceMinor`/`priceCurrency` explicitly, so the caller does not have to duplicate a value it just wrote to the inventory row. Cannot be combined with `priceMinor` or `priceCurrency`.",
    },
    syncAvailability: {
      type: GraphQLBoolean,
      description:
        "Take this edition's availability from its own catalog edition set (or the artwork's) instead of passing `saleStatus` explicitly. Cannot be combined with `saleStatus`.",
    },
  },
  outputFields: {
    artnetEditionSetOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated ArtnetEditionSet. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, priceMinor, priceCurrency, saleStatus, syncPrice, syncAvailability },
    { updateArtnetEditionSetLoader }
  ) => {
    if (!updateArtnetEditionSetLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityParams = snakeCaseKeys(
        omitBy(
          {
            priceMinor,
            priceCurrency,
            saleStatus,
            syncPrice,
            syncAvailability,
          },
          isUndefined
        )
      )

      return await updateArtnetEditionSetLoader(id, gravityParams)
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
