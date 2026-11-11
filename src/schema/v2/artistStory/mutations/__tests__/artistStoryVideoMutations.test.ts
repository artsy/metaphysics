import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runQuery } from "schema/v2/test/utils"

const mockIsFeatureFlagEnabled = jest.fn()
jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: (...args: unknown[]) =>
    mockIsFeatureFlagEnabled(...args),
}))

const signedIn = { accessToken: "secret", userID: "user-21" }

const placement = (overrides = {}) => ({
  id: "placement-1",
  artist_story_id: "story-1",
  video_id: "video-1",
  role: "motion",
  position: 0,
  caption: null,
  quote: null,
  quote_attribution: null,
  video: { _id: "video-1", title: "Kiln" },
  ...overrides,
})

const resultFields = `
  ... on ArtistStoryVideoMutationSuccess {
    artistStoryID
    videos {
      internalID
      position
      video {
        title
      }
    }
  }
  ... on ArtistStoryVideoMutationFailure {
    mutationError {
      message
      fieldErrors {
        name
        message
      }
    }
  }
`

const createMutation = gql`
  mutation {
    createArtistStoryVideo(
      input: {
        artistStoryID: "story-1"
        videoID: "video-1"
        role: MOTION
        caption: "Firing"
        quote: "Heat"
        quoteAttribution: "Heidi"
      }
    ) {
      responseOrError { ${resultFields} }
    }
  }
`

const updateMutation = gql`
  mutation {
    updateArtistStoryVideo(
      input: { id: "placement-1", role: PROCESS, position: 1, caption: null }
    ) {
      responseOrError { ${resultFields} }
    }
  }
`

const deleteMutation = gql`
  mutation {
    deleteArtistStoryVideo(input: { id: "placement-1" }) {
      responseOrError { ${resultFields} }
    }
  }
`

const validationError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Role needs a Vimeo video",
  detail: { role: ["needs a Vimeo video"] },
})

describe("artist story video mutations", () => {
  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
  })

  it.each([
    ["createArtistStoryVideo", createMutation],
    ["updateArtistStoryVideo", updateMutation],
    ["deleteArtistStoryVideo", deleteMutation],
  ])("%s needs a signed-in user", async (_name, mutation) => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  describe("createArtistStoryVideo", () => {
    it("places the video and returns the Story's refreshed list", async () => {
      const createArtistStoryVideoLoader = jest
        .fn()
        .mockResolvedValue(placement())
      const artistStoryVideosLoader = jest
        .fn()
        .mockResolvedValue([
          placement({ id: "motion-1", position: 0 }),
          placement({ id: "motion-2", position: 1 }),
          placement({ id: "orphan", position: 2, video: null }),
          placement({ id: "process", role: "process", position: 0 }),
        ])

      const data = await runQuery(createMutation, {
        ...signedIn,
        createArtistStoryVideoLoader,
        artistStoryVideosLoader,
      })

      expect(createArtistStoryVideoLoader).toHaveBeenCalledWith({
        artist_story_id: "story-1",
        video_id: "video-1",
        role: "motion",
        caption: "Firing",
        quote: "Heat",
        quote_attribution: "Heidi",
      })
      expect(artistStoryVideosLoader).toHaveBeenCalledWith({
        artist_story_id: "story-1",
      })
      expect(data.createArtistStoryVideo.responseOrError).toEqual({
        artistStoryID: "story-1",
        videos: [
          { internalID: "motion-1", position: 0, video: { title: "Kiln" } },
          { internalID: "motion-2", position: 1, video: { title: "Kiln" } },
          { internalID: "process", position: 0, video: { title: "Kiln" } },
        ],
      })
    })

    it("returns gravity's validation errors by field", async () => {
      const createArtistStoryVideoLoader = jest
        .fn()
        .mockRejectedValue(validationError)

      const data = await runQuery(createMutation, {
        ...signedIn,
        createArtistStoryVideoLoader,
      })

      expect(data.createArtistStoryVideo.responseOrError.mutationError).toEqual(
        {
          message: "Role needs a Vimeo video",
          fieldErrors: [{ name: "role", message: "needs a Vimeo video" }],
        }
      )
    })

    it("checks the editing flag for the signed-in user", async () => {
      const createArtistStoryVideoLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(createMutation, { ...signedIn, createArtistStoryVideoLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
        "fireworksq4_edit-artist-story",
        {
          userId: "user-21",
        }
      )
      expect(createArtistStoryVideoLoader).not.toHaveBeenCalled()
    })
  })

  describe("updateArtistStoryVideo", () => {
    it("updates the placement and returns the refreshed list", async () => {
      const updateArtistStoryVideoLoader = jest
        .fn()
        .mockResolvedValue(placement({ role: "process" }))
      const artistStoryVideosLoader = jest
        .fn()
        .mockResolvedValue([placement({ role: "process" })])

      const data = await runQuery(updateMutation, {
        ...signedIn,
        updateArtistStoryVideoLoader,
        artistStoryVideosLoader,
      })

      expect(updateArtistStoryVideoLoader).toHaveBeenCalledWith("placement-1", {
        role: "process",
        position: 1,
        caption: null,
      })
      expect(data.updateArtistStoryVideo.responseOrError).toEqual({
        artistStoryID: "story-1",
        videos: [
          { internalID: "placement-1", position: 0, video: { title: "Kiln" } },
        ],
      })
    })

    it("returns gravity's validation errors by field", async () => {
      const updateArtistStoryVideoLoader = jest
        .fn()
        .mockRejectedValue(validationError)

      const data = await runQuery(updateMutation, {
        ...signedIn,
        updateArtistStoryVideoLoader,
      })

      expect(
        data.updateArtistStoryVideo.responseOrError.mutationError.fieldErrors
      ).toEqual([{ name: "role", message: "needs a Vimeo video" }])
    })

    it("throws when the editing flag is off", async () => {
      const updateArtistStoryVideoLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(updateMutation, { ...signedIn, updateArtistStoryVideoLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(updateArtistStoryVideoLoader).not.toHaveBeenCalled()
    })
  })

  describe("deleteArtistStoryVideo", () => {
    it("removes the placement and returns the refreshed list", async () => {
      const deleteArtistStoryVideoLoader = jest
        .fn()
        .mockResolvedValue(placement())
      const artistStoryVideosLoader = jest.fn().mockResolvedValue([])

      const data = await runQuery(deleteMutation, {
        ...signedIn,
        deleteArtistStoryVideoLoader,
        artistStoryVideosLoader,
      })

      expect(deleteArtistStoryVideoLoader).toHaveBeenCalledWith(
        "placement-1",
        {}
      )
      expect(data.deleteArtistStoryVideo.responseOrError).toEqual({
        artistStoryID: "story-1",
        videos: [],
      })
    })

    it("returns gravity's errors as a mutation error", async () => {
      const deleteArtistStoryVideoLoader = jest
        .fn()
        .mockRejectedValue(
          new HTTPError("Forbidden", 403, { error: "Forbidden" })
        )

      const data = await runQuery(deleteMutation, {
        ...signedIn,
        deleteArtistStoryVideoLoader,
      })

      expect(
        data.deleteArtistStoryVideo.responseOrError.mutationError.message
      ).toBe("Forbidden")
    })

    it("throws when the editing flag is off", async () => {
      const deleteArtistStoryVideoLoader = jest.fn()
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(
        runQuery(deleteMutation, { ...signedIn, deleteArtistStoryVideoLoader })
      ).rejects.toThrow("This feature is not currently enabled")

      expect(deleteArtistStoryVideoLoader).not.toHaveBeenCalled()
    })
  })
})
