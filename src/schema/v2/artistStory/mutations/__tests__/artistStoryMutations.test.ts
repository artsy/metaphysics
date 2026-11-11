import config from "config"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runQuery } from "schema/v2/test/utils"

const mockIsFeatureFlagEnabled = jest.fn()
jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: (...args: unknown[]) =>
    mockIsFeatureFlagEnabled(...args),
}))

const signedIn = { accessToken: "secret", userID: "user-23" }

const gravityStory = {
  id: "story-1",
  partner_artist_id: "pa-1",
  tagline: "Clay as memory",
  pull_quote: "I follow the material.",
  pull_quote_attribution: "Heidi Lau",
  accent_color: "#112233",
  portrait_image: null,
  header_image: null,
}

const storyFields = `
  ... on ArtistStoryMutationSuccess {
    artistStory {
      internalID
      about { tagline }
      pullQuote { text attribution }
    }
  }
  ... on ArtistStoryMutationFailure {
    mutationError {
      message
      fieldErrors { name message }
    }
  }
`

const createMutation = gql`
  mutation {
    createArtistStory(
      input: {
        partnerArtistID: "pa-1"
        tagline: "Clay as memory"
        pullQuote: "I follow the material."
        pullQuoteAttribution: "Heidi Lau"
        portraitImageS3Key: "portrait/key.jpg"
        portraitImageS3Bucket: "uploads"
        portraitAltText: "Heidi in her studio"
      }
    ) {
      responseOrError { ${storyFields} }
    }
  }
`

const updateMutation = gql`
  mutation {
    updateArtistStory(
      input: { id: "story-1", tagline: "Clay as memory", accentColor: "#112233" }
    ) {
      responseOrError { ${storyFields} }
    }
  }
`

const deleteMutation = gql`
  mutation {
    deleteArtistStory(input: { id: "story-1" }) {
      responseOrError {
        ... on DeleteArtistStorySuccess {
          artistStoryID
        }
        ... on ArtistStoryMutationFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

const savedStory = {
  internalID: "story-1",
  about: { tagline: "Clay as memory" },
  pullQuote: { text: "I follow the material.", attribution: "Heidi Lau" },
}

const validationError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Portrait alt text can't be blank",
  detail: { portrait_alt_text: ["can't be blank"] },
})

describe("artist story mutations", () => {
  const originalNodeEnv = config.NODE_ENV

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
  })

  afterEach(() => {
    config.NODE_ENV = originalNodeEnv
  })

  it.each([
    ["createArtistStory", createMutation],
    ["updateArtistStory", updateMutation],
    ["deleteArtistStory", deleteMutation],
  ])("%s needs a signed-in user", async (_name, mutation) => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  describe("createArtistStory", () => {
    it("creates the Story, sending the images' S3 location as gravity names it", async () => {
      const createArtistStoryLoader = jest.fn().mockResolvedValue(gravityStory)

      const data = await runQuery(createMutation, {
        ...signedIn,
        createArtistStoryLoader,
      })

      expect(createArtistStoryLoader).toHaveBeenCalledWith({
        partner_artist_id: "pa-1",
        tagline: "Clay as memory",
        pull_quote: "I follow the material.",
        pull_quote_attribution: "Heidi Lau",
        portrait_image_s3_key: "portrait/key.jpg",
        portrait_image_s3_bucket: "uploads",
        portrait_alt_text: "Heidi in her studio",
      })
      expect(data.createArtistStory.responseOrError.artistStory).toEqual(
        savedStory
      )
    })

    it("returns gravity's validation errors by field", async () => {
      const createArtistStoryLoader = jest
        .fn()
        .mockRejectedValue(validationError)

      const data = await runQuery(createMutation, {
        ...signedIn,
        createArtistStoryLoader,
      })

      expect(data.createArtistStory.responseOrError.mutationError).toEqual({
        message: "Portrait alt text can't be blank",
        fieldErrors: [{ name: "portrait_alt_text", message: "can't be blank" }],
      })
    })

    it("checks the editing flag for the signed-in user", async () => {
      const createArtistStoryLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(createMutation, { ...signedIn, createArtistStoryLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
        "fireworksq4_edit-artist-story",
        {
          userId: "user-23",
        }
      )
      expect(createArtistStoryLoader).not.toHaveBeenCalled()
    })

    it("skips the flag in development", async () => {
      config.NODE_ENV = "development"
      mockIsFeatureFlagEnabled.mockReturnValue(false)
      const createArtistStoryLoader = jest.fn().mockResolvedValue(gravityStory)

      const data = await runQuery(createMutation, {
        ...signedIn,
        createArtistStoryLoader,
      })

      expect(data.createArtistStory.responseOrError.artistStory).toEqual(
        savedStory
      )
    })
  })

  describe("updateArtistStory", () => {
    it("updates the Story and sends only the fields given", async () => {
      const updateArtistStoryLoader = jest.fn().mockResolvedValue(gravityStory)

      const data = await runQuery(updateMutation, {
        ...signedIn,
        updateArtistStoryLoader,
      })

      expect(updateArtistStoryLoader).toHaveBeenCalledWith("story-1", {
        tagline: "Clay as memory",
        accent_color: "#112233",
      })
      expect(data.updateArtistStory.responseOrError.artistStory).toEqual(
        savedStory
      )
    })

    it("returns gravity's validation errors by field", async () => {
      const updateArtistStoryLoader = jest
        .fn()
        .mockRejectedValue(validationError)

      const data = await runQuery(updateMutation, {
        ...signedIn,
        updateArtistStoryLoader,
      })

      expect(
        data.updateArtistStory.responseOrError.mutationError.fieldErrors
      ).toEqual([{ name: "portrait_alt_text", message: "can't be blank" }])
    })

    it("throws when the editing flag is off", async () => {
      const updateArtistStoryLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(updateMutation, { ...signedIn, updateArtistStoryLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(updateArtistStoryLoader).not.toHaveBeenCalled()
    })
  })

  describe("deleteArtistStory", () => {
    it("deletes the Story and returns its id", async () => {
      const deleteArtistStoryLoader = jest.fn().mockResolvedValue(gravityStory)

      const data = await runQuery(deleteMutation, {
        ...signedIn,
        deleteArtistStoryLoader,
      })

      expect(deleteArtistStoryLoader).toHaveBeenCalledWith("story-1", {})
      expect(data.deleteArtistStory.responseOrError).toEqual({
        artistStoryID: "story-1",
      })
    })

    it("returns gravity's errors as a mutation error", async () => {
      const deleteArtistStoryLoader = jest
        .fn()
        .mockRejectedValue(
          new HTTPError("Forbidden", 403, { error: "Forbidden" })
        )

      const data = await runQuery(deleteMutation, {
        ...signedIn,
        deleteArtistStoryLoader,
      })

      expect(data.deleteArtistStory.responseOrError.mutationError.message).toBe(
        "Forbidden"
      )
    })

    it("throws when the editing flag is off", async () => {
      const deleteArtistStoryLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(deleteMutation, { ...signedIn, deleteArtistStoryLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(deleteArtistStoryLoader).not.toHaveBeenCalled()
    })
  })
})
