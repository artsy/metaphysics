import config from "config"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("refreshArtistAccentColorOptionsMutation", () => {
  const mutation = gql`
    mutation {
      refreshArtistAccentColorOptions(input: { artistID: "heidi-lau" }) {
        responseOrError {
          __typename
          ... on RefreshArtistAccentColorOptionsSuccess {
            accentColorOptions {
              hex
              textColor
            }
          }
          ... on RefreshArtistAccentColorOptionsFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const originalNodeEnv = config.NODE_ENV
  let refreshArtistAccentColorOptionsLoader

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
    refreshArtistAccentColorOptionsLoader = jest
      .fn()
      .mockResolvedValue(["#ffffff", "#1a1a2e"])
  })

  afterEach(() => {
    config.NODE_ENV = originalNodeEnv
  })

  it("rebuilds the options when the flag is on", async () => {
    const data = await runAuthenticatedQuery(mutation, {
      refreshArtistAccentColorOptionsLoader,
    })

    expect(data).toEqual({
      refreshArtistAccentColorOptions: {
        responseOrError: {
          __typename: "RefreshArtistAccentColorOptionsSuccess",
          accentColorOptions: [
            { hex: "#ffffff", textColor: "BLACK" },
            { hex: "#1a1a2e", textColor: "WHITE" },
          ],
        },
      },
    })
    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      "fireworksq4_edit-artist-story",
      {
        userId: "user-42",
      }
    )
    expect(refreshArtistAccentColorOptionsLoader).toHaveBeenCalledWith({
      artist_id: "heidi-lau",
    })
  })

  it("errors without calling Gravity when the flag is off", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)

    await expect(
      runAuthenticatedQuery(mutation, { refreshArtistAccentColorOptionsLoader })
    ).rejects.toThrow("This feature is not currently enabled")
    expect(refreshArtistAccentColorOptionsLoader).not.toHaveBeenCalled()
  })

  it("skips the flag in development", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)
    config.NODE_ENV = "development"

    await runAuthenticatedQuery(mutation, {
      refreshArtistAccentColorOptionsLoader,
    })

    expect(refreshArtistAccentColorOptionsLoader).toHaveBeenCalled()
  })

  it("errors when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("returns a Gravity error as a failure", async () => {
    refreshArtistAccentColorOptionsLoader.mockRejectedValue(
      new HTTPError(
        "Error",
        404,
        '{"type":"error","message":"Artist not found"}'
      )
    )

    const data = await runAuthenticatedQuery(mutation, {
      refreshArtistAccentColorOptionsLoader,
    })

    expect(data.refreshArtistAccentColorOptions.responseOrError).toEqual({
      __typename: "RefreshArtistAccentColorOptionsFailure",
      mutationError: { message: "Artist not found" },
    })
  })
})
