import config from "config"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runQuery } from "schema/v2/test/utils"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

const gravityStory = {
  id: "story-1",
  partner_artist_id: "pa-featured",
  tagline: "Clay as memory",
  pull_quote: null,
  pull_quote_attribution: null,
  about_body: null,
  portrait_image: null,
  portrait_alt_text: null,
  portrait_credit: null,
  header_image: null,
  header_image_alt_text: null,
  header_image_credit: null,
  accent_color: null,
}

describe("Artist story", () => {
  const query = `
    {
      artist(id: "heidi-lau") {
        story {
          internalID
          tagline
        }
      }
    }
  `
  const originalNodeEnv = config.NODE_ENV

  let partnerArtistsForArtistLoader
  let artistStoriesLoader
  let context

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
    partnerArtistsForArtistLoader = jest
      .fn()
      .mockResolvedValue([{ id: "pa-featured" }])
    artistStoriesLoader = jest.fn().mockResolvedValue([gravityStory])
    context = {
      artistLoader: jest.fn().mockResolvedValue({ id: "heidi-lau" }),
      partnerArtistsForArtistLoader,
      artistStoriesLoader,
    }
  })

  afterEach(() => {
    config.NODE_ENV = originalNodeEnv
  })

  it("returns the Featured Partner's story when the flag is on", async () => {
    const data = await runQuery(query, context)

    expect(data.artist.story).toEqual({
      internalID: "story-1",
      tagline: "Clay as memory",
    })
    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      "fireworksq4_artist-story"
    )
    expect(partnerArtistsForArtistLoader).toHaveBeenCalledWith("heidi-lau", {
      size: 1,
      featured: true,
    })
    expect(artistStoriesLoader).toHaveBeenCalledWith({
      partner_artist_id: "pa-featured",
    })
  })

  it("returns null without calling Gravity when the flag is off", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)

    const data = await runQuery(query, context)

    expect(data.artist.story).toBeNull()
    expect(partnerArtistsForArtistLoader).not.toHaveBeenCalled()
    expect(artistStoriesLoader).not.toHaveBeenCalled()
  })

  it("skips the flag in development", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)
    config.NODE_ENV = "development"

    const data = await runQuery(query, context)

    expect(data.artist.story.internalID).toBe("story-1")
    expect(mockIsFeatureFlagEnabled).not.toHaveBeenCalled()
  })

  it("returns null when there is no Featured Partner", async () => {
    partnerArtistsForArtistLoader.mockResolvedValue([])

    const data = await runQuery(query, context)

    expect(data.artist.story).toBeNull()
    expect(artistStoriesLoader).not.toHaveBeenCalled()
  })

  it("returns null when the Featured Partner has no story row", async () => {
    artistStoriesLoader.mockResolvedValue([])

    const data = await runQuery(query, context)

    expect(data.artist.story).toBeNull()
  })

  it("returns null when every field in the row is empty", async () => {
    artistStoriesLoader.mockResolvedValue([
      { ...gravityStory, tagline: "", about_body: "  " },
    ])

    const data = await runQuery(query, context)

    expect(data.artist.story).toBeNull()
  })
})
