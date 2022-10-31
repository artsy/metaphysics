import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import { UserType } from "../user"
import Me, { CurrencyPreference, LengthUnitPreference } from "./"
import { externalUrlRegex } from "./myCollectionCreateArtworkMutation"

export const EditableLocationFields = new GraphQLInputObjectType({
  name: "EditableLocation",
  fields: {
    address: {
      description: "First line of an address",
      type: GraphQLString,
    },
    address2: {
      description: "Second line of an address",
      type: GraphQLString,
    },
    city: {
      description: "The city the location is based in",
      type: GraphQLString,
    },
    country: {
      description: "The county the location is based in",
      type: GraphQLString,
    },
    countryCode: {
      description: "The county code of the location is based in",
      type: GraphQLString,
    },
    summary: {
      description: "An optional display string for the location",
      type: GraphQLString,
    },
    postalCode: {
      description: "Postal code for a string",
      type: GraphQLString,
    },
    state: {
      description: "The (optional) name of the state for location",
      type: GraphQLString,
    },
    stateCode: {
      description: "The (optional) state code of the state for location",
      type: GraphQLString,
    },
  },
})

const UpdateMyProfileMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdateMyProfileMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (user) => user,
    },
  }),
})

const UpdateMyProfileMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdateMyProfileMutationFailure",
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

const UpdateMyProfileMutationType = new GraphQLUnionType({
  name: "UpdateMyProfileMutation",
  types: [
    UpdateMyProfileMutationSuccessType,
    UpdateMyProfileMutationFailureType,
  ],
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateMyProfile",
  description: "Update the current logged in user.",
  inputFields: {
    artworksPerYear: {
      type: GraphQLString,
      description: "Number of artworks purchased per year.",
    },
    bio: {
      type: GraphQLString,
      description: "The user's bio",
    },
    collectorLevel: {
      description: "The collector level for the user",
      type: GraphQLInt,
    },
    completedOnboarding: {
      description: "The user completed onboarding.",
      type: GraphQLBoolean,
    },
    currencyPreference: {
      description: "Currency preference of the user",
      type: CurrencyPreference,
    },
    email: { description: "The given email of the user.", type: GraphQLString },
    emailFrequency: {
      description: "Frequency of marketing emails.",
      type: GraphQLString,
    },
    gender: { type: GraphQLString, description: "Gender." },
    industry: {
      type: GraphQLString,
      description: "Works in the art industry?",
    },
    isCollector: { type: GraphQLBoolean, description: "Is a collector?" },
    iconUrl: {
      type: GraphQLString,
      description: "User's icon source_url for Gemini",
    },
    location: {
      description: "The given location of the user as structured data",
      type: EditableLocationFields,
    },
    lengthUnitPreference: {
      description: "Length unit preference of the user",
      type: LengthUnitPreference,
    },
    name: { description: "The given name of the user.", type: GraphQLString },
    notes: { type: GraphQLString, description: "Additional personal notes." },
    password: {
      description: "The user's password, required to change email address.",
      type: GraphQLString,
    },
    phone: {
      description: "The given phone number of the user.",
      type: GraphQLString,
    },
    priceRangeMax: {
      description: "The maximum price collector has selected",
      type: GraphQLFloat,
    },
    priceRangeMin: {
      description: "The minimum price collector has selected",
      type: GraphQLInt,
    },
    privacy: {
      description:
        "Wheter or not the collector shares detailed profile information with galleries.",
      type: GraphQLString,
    },
    profession: { type: GraphQLString, description: "Profession." },
    otherRelevantPositions: {
      type: GraphQLString,
      description: "Collector's positions with relevant institutions",
    },
    receiveLotOpeningSoonNotification: {
      description: "This user should receive lot opening notifications",
      type: GraphQLBoolean,
    },
    receiveNewSalesNotification: {
      description: "This user should receive new sales notifications",
      type: GraphQLBoolean,
    },
    receiveNewWorksNotification: {
      description: "This user should receive new works notifications",
      type: GraphQLBoolean,
    },
    receiveOutbidNotification: {
      description: "This user should receive outbid notifications",
      type: GraphQLBoolean,
    },
    receivePromotionNotification: {
      description: "This user should receive promotional notifications",
      type: GraphQLBoolean,
    },
    receivePurchaseNotification: {
      description: "This user should receive purchase notifications",
      type: GraphQLBoolean,
    },
    receiveSaleOpeningClosingNotification: {
      description:
        "This user should receive sale opening/closing notifications",
      type: GraphQLBoolean,
    },
    receiveOrderNotification: {
      description: "This user should receive order notifications",
      type: GraphQLBoolean,
    },
    receiveViewingRoomNotification: {
      description: "This user should receive viewing room notifications",
      type: GraphQLBoolean,
    },
    receivePartnerShowNotification: {
      description: "This user should receive partner show notifications",
      type: GraphQLBoolean,
    },
    shareFollows: {
      description:
        "Shares FollowArtists, FollowGenes, and FollowProfiles with partners.",
      type: GraphQLBoolean,
    },
  },
  outputFields: {
    user: {
      type: UserType,
      resolve: (user) => user,
    },
    userOrError: {
      type: UpdateMyProfileMutationType,
      resolve: (result) => result,
    },
    me: Me,
  },
  mutateAndGetPayload: async (
    { iconUrl, ...args },
    { updateMeLoader, updateCollectorProfileIconLoader }
  ) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const user = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!updateMeLoader || !updateCollectorProfileIconLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      if (iconUrl) {
        const imageSource = computeImageSources([iconUrl])
        for (const payload of imageSource) {
          await updateCollectorProfileIconLoader(payload)
        }
      }
      return await updateMeLoader(user)
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

export const computeImageSources = (externalImageUrls) => {
  const imageSources = externalImageUrls.map((url) => {
    const match = url.match(externalUrlRegex)

    if (!match) return

    const { sourceBucket, sourceKey } = match.groups

    return {
      source_bucket: sourceBucket,
      source_key: sourceKey,
    }
  })

  const filteredImageSources = imageSources.filter(Boolean)
  return filteredImageSources
}
