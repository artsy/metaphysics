import { GraphQLNonNull, GraphQLString } from "graphql"
import { isUndefined, omitBy } from "lodash"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import { ArtistStoryMutationResponseOrErrorType } from "./artistStoryMutationResponseOrError"

export const artistStoryInputFields = {
  tagline: { type: GraphQLString, description: "Plain text, max 250." },
  pullQuote: { type: GraphQLString, description: "Plain text, max 250." },
  pullQuoteAttribution: { type: GraphQLString },
  aboutBody: { type: GraphQLString, description: "Markdown." },
  portraitImageS3Key: { type: GraphQLString },
  portraitImageS3Bucket: { type: GraphQLString },
  portraitAltText: {
    type: GraphQLString,
    description: "Required while a Portrait is set.",
  },
  portraitCredit: { type: GraphQLString },
  headerImageS3Key: { type: GraphQLString },
  headerImageS3Bucket: { type: GraphQLString },
  headerImageAltText: {
    type: GraphQLString,
    description: "Required while a Header Image is set.",
  },
  headerImageCredit: { type: GraphQLString },
  accentColor: {
    type: GraphQLString,
    description:
      "Hex string. Must be one of the artist's accent color options when it changes.",
  },
}

export interface ArtistStoryInputAttributes {
  tagline?: string | null
  pullQuote?: string | null
  pullQuoteAttribution?: string | null
  aboutBody?: string | null
  portraitImageS3Key?: string | null
  portraitImageS3Bucket?: string | null
  portraitAltText?: string | null
  portraitCredit?: string | null
  headerImageS3Key?: string | null
  headerImageS3Bucket?: string | null
  headerImageAltText?: string | null
  headerImageCredit?: string | null
  accentColor?: string | null
}

export const toGravityArtistStoryAttributes = (
  input: ArtistStoryInputAttributes
) => {
  const attributes = {
    tagline: input.tagline,
    pull_quote: input.pullQuote,
    pull_quote_attribution: input.pullQuoteAttribution,
    about_body: input.aboutBody,
    portrait_image_s3_key: input.portraitImageS3Key,
    portrait_image_s3_bucket: input.portraitImageS3Bucket,
    portrait_alt_text: input.portraitAltText,
    portrait_credit: input.portraitCredit,
    header_image_s3_key: input.headerImageS3Key,
    header_image_s3_bucket: input.headerImageS3Bucket,
    header_image_alt_text: input.headerImageAltText,
    header_image_credit: input.headerImageCredit,
    accent_color: input.accentColor,
  }

  return omitBy(attributes, isUndefined)
}

interface InputProps extends ArtistStoryInputAttributes {
  clientMutationId?: string
  partnerArtistID: string
}

export const createArtistStoryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createArtistStory",
  inputFields: {
    partnerArtistID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ...artistStoryInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ArtistStoryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, partnerArtistID, ...attributes },
    { createArtistStoryLoader, userID }
  ) => {
    if (!createArtistStoryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    try {
      return await createArtistStoryLoader({
        partner_artist_id: partnerArtistID,
        ...toGravityArtistStoryAttributes(attributes),
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
