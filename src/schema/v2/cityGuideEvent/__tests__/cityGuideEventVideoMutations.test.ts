import { runQuery } from "schema/v2/test/utils"

const gravityCityGuideEventWithVideo = {
  id: "event-1",
  slug: "london-art-week",
  title: "London Art Week",
  subtitle: null,
  description: null,
  city_slug: "london-united-kingdom",
  start_at: "2026-10-05T00:00:00Z",
  end_at: "2026-10-12T00:00:00Z",
  time_zone: null,
  published_at: null,
  published_by_id: null,
  image_url: null,
  image_urls: null,
  itineraries: [],
  articles: [],
  video: {
    _id: "video-1",
    title: "Trailer",
    description: null,
    player_embed_url: "https://player.vimeo.com/video/123",
    height: 1080,
    width: 1920,
    aspect_ratio: 1.78,
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  },
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

describe("setCityGuideEventVideo", () => {
  it("sets the event's video", async () => {
    // Gravity's PUT /:id/video returns the updated event with its video already
    // embedded — no separate videoLoader call needed on the read side (Task 2).
    const setCityGuideEventVideoLoader = jest
      .fn()
      .mockResolvedValue(gravityCityGuideEventWithVideo)

    const mutation = `
      mutation {
        setCityGuideEventVideo(input: { id: "london-art-week", videoID: "video-1" }) {
          responseOrError {
            ... on CityGuideEventMutationSuccess {
              cityGuideEvent { video { internalID } }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, { setCityGuideEventVideoLoader })

    expect(setCityGuideEventVideoLoader).toHaveBeenCalledWith(
      "london-art-week",
      {
        video_id: "video-1",
      }
    )
    expect(
      data.setCityGuideEventVideo.responseOrError.cityGuideEvent.video
        .internalID
    ).toEqual("video-1")
  })
})

describe("removeCityGuideEventVideo", () => {
  it("clears the event's video", async () => {
    const removeCityGuideEventVideoLoader = jest
      .fn()
      .mockResolvedValue({ ...gravityCityGuideEventWithVideo, video: null })

    const mutation = `
      mutation {
        removeCityGuideEventVideo(input: { id: "london-art-week" }) {
          responseOrError {
            ... on CityGuideEventMutationSuccess {
              cityGuideEvent { video { internalID } }
            }
          }
        }
      }
    `

    const data = await runQuery(mutation, { removeCityGuideEventVideoLoader })

    expect(removeCityGuideEventVideoLoader).toHaveBeenCalledWith(
      "london-art-week",
      {}
    )
    expect(
      data.removeCityGuideEventVideo.responseOrError.cityGuideEvent.video
    ).toBeNull()
  })
})
