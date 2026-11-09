import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runQuery } from "schema/v2/test/utils"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

const gravityStory = {
  id: "story-1",
  partner_artist_id: "pa-featured",
  tagline: "Clay as memory",
  pull_quote: "I follow the material.",
  pull_quote_attribution: "Heidi Lau",
  about_body: "About Heidi",
  portrait_image: {
    id: "portrait-1",
    image_url: "https://img.test/portrait/:version.jpg",
    image_versions: ["large"],
  },
  portrait_alt_text: "Heidi in her studio",
  portrait_credit: "Photo: A. Photographer",
  header_image: {
    id: "header-1",
    image_url: "https://img.test/header/:version.jpg",
    image_versions: ["large"],
  },
  header_image_alt_text: "Her kiln",
  header_image_credit: null,
  accent_color: null,
}

const video = {
  _id: "video-1",
  title: "Video",
  player_embed_url: "https://player.vimeo.com/video/1",
  width: 1920,
  height: 1080,
  aspect_ratio: 1.78,
}

const headerPlacement = {
  id: "header",
  artist_story_id: "story-1",
  role: "header",
  position: 0,
  caption: null,
  quote: null,
  quote_attribution: null,
  video,
}

describe("ArtistStory", () => {
  let artistVideosLoader
  let context

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockReset().mockReturnValue(true)
    artistVideosLoader = jest.fn().mockResolvedValue([])
    context = {
      artistLoader: jest.fn().mockResolvedValue({ id: "heidi-lau" }),
      partnerArtistsForArtistLoader: jest
        .fn()
        .mockResolvedValue([{ id: "pa-featured" }]),
      artistStoriesLoader: jest.fn().mockResolvedValue([gravityStory]),
      artistVideosLoader,
    }
  })

  describe("text and images", () => {
    const query = `
      {
        artist(id: "heidi-lau") {
          story {
            pullQuote {
              text
              attribution
            }
            aboutBody
            portrait {
              altText
              credit
              image {
                url(version: "large")
              }
            }
            headerImage {
              altText
              credit
              image {
                url(version: "large")
              }
            }
          }
        }
      }
    `

    it("returns the quote, body and both images", async () => {
      const data = await runQuery(query, context)

      expect(data.artist.story).toEqual({
        pullQuote: { text: "I follow the material.", attribution: "Heidi Lau" },
        aboutBody: "About Heidi",
        portrait: {
          altText: "Heidi in her studio",
          credit: "Photo: A. Photographer",
          image: { url: "https://img.test/portrait/large.jpg" },
        },
        headerImage: {
          altText: "Her kiln",
          credit: null,
          image: { url: "https://img.test/header/large.jpg" },
        },
      })
    })

    it("returns no quote and no image when they are empty or still processing", async () => {
      context.artistStoriesLoader.mockResolvedValue([
        {
          ...gravityStory,
          pull_quote: null,
          portrait_image: { id: "portrait-1" },
          header_image: null,
        },
      ])

      const data = await runQuery(query, context)

      expect(data.artist.story.pullQuote).toBeNull()
      expect(data.artist.story.portrait).toBeNull()
      expect(data.artist.story.headerImage).toBeNull()
    })
  })

  describe("videos", () => {
    const query = `
      {
        artist(id: "heidi-lau") {
          story {
            headerVideo {
              internalID
              role
              video {
                internalID
              }
            }
            motionVideos {
              internalID
              position
              caption
              quote {
                text
                attribution
              }
            }
            processVideo {
              internalID
              role
            }
          }
        }
      }
    `

    it("returns each role's videos, motion videos in position order, and skips placements without a video", async () => {
      artistVideosLoader.mockResolvedValue([
        { ...headerPlacement, id: "motion-2", role: "motion", position: 1 },
        headerPlacement,
        {
          ...headerPlacement,
          id: "motion-1",
          role: "motion",
          caption: "Throwing a vase",
          quote: "Clay remembers.",
          quote_attribution: "Heidi Lau",
        },
        { ...headerPlacement, id: "process", role: "process" },
        { ...headerPlacement, id: "orphan", role: "motion", video: null },
      ])

      const data = await runQuery(query, context)

      expect(artistVideosLoader).toHaveBeenCalledWith({
        artist_story_id: "story-1",
      })
      expect(data.artist.story).toEqual({
        headerVideo: {
          internalID: "header",
          role: "HEADER",
          video: { internalID: "video-1" },
        },
        motionVideos: [
          {
            internalID: "motion-1",
            position: 0,
            caption: "Throwing a vase",
            quote: { text: "Clay remembers.", attribution: "Heidi Lau" },
          },
          {
            internalID: "motion-2",
            position: 1,
            caption: null,
            quote: null,
          },
        ],
        processVideo: { internalID: "process", role: "PROCESS" },
      })
    })

    it("keeps the story when the videos fail to load", async () => {
      artistVideosLoader.mockRejectedValue(new Error("Gravity is down"))

      const data = await runQuery(
        `
          {
            artist(id: "heidi-lau") {
              story {
                tagline
                motionVideos {
                  internalID
                }
              }
            }
          }
        `,
        context
      )

      expect(data.artist.story).toEqual({
        tagline: "Clay as memory",
        motionVideos: [],
      })
    })

    it("returns no videos when the story has none", async () => {
      const data = await runQuery(query, context)

      expect(data.artist.story).toEqual({
        headerVideo: null,
        motionVideos: [],
        processVideo: null,
      })
    })
  })
})
