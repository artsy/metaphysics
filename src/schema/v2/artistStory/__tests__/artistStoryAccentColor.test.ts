import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runQuery } from "schema/v2/test/utils"
import { toAccentColor } from "../artistStoryAccentColor"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("toAccentColor", () => {
  it.each([
    ["white", "#ffffff"],
    ["a light yellow", "#f5e6a8"],
    ["a light grey", "#cccccc"],
  ])("picks black text on %s", (_name, hex) => {
    expect(toAccentColor(hex)).toEqual({ hex, textColor: "BLACK" })
  })

  it.each([
    ["black", "#000000"],
    ["a dark navy", "#1a1a2e"],
    ["a dark red", "#8b0000"],
  ])("picks white text on %s", (_name, hex) => {
    expect(toAccentColor(hex)).toEqual({ hex, textColor: "WHITE" })
  })

  // The two texts tie at a relative luminance of about 0.179, near #777777.
  it.each([
    ["#808080", "BLACK"],
    ["#767676", "BLACK"],
    ["#707070", "WHITE"],
    ["#6a6a6a", "WHITE"],
  ])("picks the higher contrast text on the mid color %s", (hex, textColor) => {
    expect(toAccentColor(hex)).toEqual({ hex, textColor })
  })

  it("accepts a hex without the hash, or in short form", () => {
    expect(toAccentColor("1a1a2e")).toEqual({
      hex: "1a1a2e",
      textColor: "WHITE",
    })
    expect(toAccentColor("#fff")).toEqual({ hex: "#fff", textColor: "BLACK" })
  })

  it.each([null, undefined, "", "not-a-color", "#12345"])(
    "returns null for %p",
    (hex) => {
      expect(toAccentColor(hex)).toBeNull()
    }
  )
})

describe("ArtistStory accentColor", () => {
  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
  })

  const query = `
    {
      artist(id: "heidi-lau") {
        featuredStory {
          accentColor {
            hex
            textColor
          }
        }
      }
    }
  `

  const contextWith = (accent_color: string | null) => ({
    artistLoader: jest.fn().mockResolvedValue({ id: "heidi-lau" }),
    partnerArtistsForArtistLoader: jest
      .fn()
      .mockResolvedValue([{ id: "pa-featured" }]),
    artistStoriesLoader: jest
      .fn()
      .mockResolvedValue([{ id: "story-1", accent_color }]),
  })

  it("returns the saved color with its text color", async () => {
    const data = await runQuery(query, contextWith("#1a1a2e"))

    expect(data.artist.featuredStory.accentColor).toEqual({
      hex: "#1a1a2e",
      textColor: "WHITE",
    })
  })

  it("returns null without a saved color", async () => {
    const data = await runQuery(query, contextWith(null))

    expect(data.artist.featuredStory.accentColor).toBeNull()
  })
})
