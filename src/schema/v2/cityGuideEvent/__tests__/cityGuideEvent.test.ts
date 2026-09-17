import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const gravityCityGuideEvent = {
  id: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
  slug: "london-art-week",
  title: "London Art Week",
  subtitle: "Openings across the city",
  description: "A week of gallery openings.",
  city_slug: "london-united-kingdom",
  start_at: "2026-10-05T00:00:00Z",
  end_at: "2026-10-12T00:00:00Z",
  time_zone: "Europe/London",
  published_at: "2026-09-01T09:00:00Z",
  published_by_id: "editor-1",
  image_url:
    "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/:version.jpg",
  image_urls: {
    large:
      "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/large.jpg",
  },
  itineraries: [
    {
      id: "join-1",
      city_guide_event_id: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
      itinerary_id: "itin-1",
      position: 0,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
      itinerary: {
        id: "itin-1",
        slug: "peckham-crawl",
        user_id: "user-1",
        city_slug: "london-united-kingdom",
        title: "Peckham Crawl",
        subtitle: null,
        description: null,
        author_name: "Casey Lesser",
        is_curated: true,
        visibility: "public",
        published_at: "2026-08-01T09:00:00Z",
        published_by_id: null,
        share_token: null,
        sections_count: 3,
        image_url: null,
        image_urls: null,
        created_at: "2026-08-01T09:00:00Z",
        updated_at: "2026-08-01T09:00:00Z",
        // No `sections` key: mirrors Gravity's `:short` embedded shape.
      },
    },
  ],
  articles: [
    {
      id: "article-join-1",
      city_guide_event_id: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
      article_id: "article-1",
      position: 0,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
    },
  ],
  video: null,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
}

const loaders = (overrides = {}) => ({
  cityGuideEventLoader: jest.fn().mockResolvedValue(gravityCityGuideEvent),
  showsLoader: jest.fn().mockResolvedValue([]),
  partnerLocationByIdLoader: jest.fn().mockResolvedValue(null),
  fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
  ...overrides,
})

describe("CityGuideEvent", () => {
  it("maps Gravity's payload onto the type", async () => {
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          internalID
          slug
          title
          subtitle
          description
          citySlug
          timeZone
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.cityGuideEvent).toEqual({
      internalID: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
      slug: "london-art-week",
      title: "London Art Week",
      subtitle: "Openings across the city",
      description: "A week of gallery openings.",
      citySlug: "london-united-kingdom",
      timeZone: "Europe/London",
    })
  })

  it("derives the hero image versions from the URL hash", async () => {
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          heroImage {
            url(version: "large")
          }
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.cityGuideEvent.heroImage.url).toEqual(
      "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/large.jpg"
    )
  })

  it("exposes each attachment's own id and position alongside the itinerary", async () => {
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          itineraries {
            internalID
            position
            itinerary {
              internalID
              title
              sections {
                title
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.cityGuideEvent.itineraries).toEqual([
      {
        internalID: "join-1",
        position: 0,
        itinerary: {
          internalID: "itin-1",
          title: "Peckham Crawl",
          // No sections: mirrors Gravity's `:short` embedded itinerary shape.
          sections: [],
        },
      },
    ])
  })

  it("pools stop-item lookups across every attached itinerary", async () => {
    const stopAt = (n: number) => ({
      id: `stop-${n}`,
      itinerary_section_id: `section-${n}`,
      position: 0,
      item_type: "PartnerShow",
      item_id: `show-${n}`,
      event_type: null,
      event_id: null,
      title: null,
      address: null,
      image_url: null,
      latitude: null,
      longitude: null,
      start_at: null,
      end_at: null,
      time_zone: null,
      note: null,
      category: null,
      is_free_admission: null,
      source_url: null,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
    })
    const joinAt = (n: number) => ({
      ...gravityCityGuideEvent.itineraries[0],
      id: `join-${n}`,
      itinerary_id: `itin-${n}`,
      position: n - 1,
      itinerary: {
        ...gravityCityGuideEvent.itineraries[0].itinerary,
        id: `itin-${n}`,
        sections: [
          {
            id: `section-${n}`,
            itinerary_id: `itin-${n}`,
            title: "Morning",
            note: null,
            position: 0,
            stops_count: 1,
            stops: [stopAt(n)],
            created_at: "2026-08-01T09:00:00Z",
            updated_at: "2026-08-01T09:00:00Z",
          },
        ],
      },
    })
    const showsLoader = jest.fn().mockResolvedValue({
      body: [
        { _id: "show-1", id: "show-1", name: "Show 1" },
        { _id: "show-2", id: "show-2", name: "Show 2" },
      ],
      headers: {},
    })
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          itineraries {
            itinerary {
              sections {
                stops {
                  item {
                    __typename
                    ... on Show {
                      internalID
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const data = await runQuery(
      query,
      loaders({
        cityGuideEventLoader: jest.fn().mockResolvedValue({
          ...gravityCityGuideEvent,
          itineraries: [joinAt(1), joinAt(2)],
        }),
        showsLoader,
      })
    )

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith(
      expect.objectContaining({ id: ["show-1", "show-2"] })
    )
    expect(
      data.cityGuideEvent.itineraries.map(
        (join) => join.itinerary.sections[0].stops[0].item
      )
    ).toEqual([
      { __typename: "Show", internalID: "show-1" },
      { __typename: "Show", internalID: "show-2" },
    ])
  })

  it("resolves null on a Gravity 404", async () => {
    const query = `{ cityGuideEvent(id: "nope") { title } }`

    const data = await runQuery(
      query,
      loaders({
        cityGuideEventLoader: jest
          .fn()
          .mockRejectedValue(new HTTPError("Not Found", 404)),
      })
    )

    expect(data.cityGuideEvent).toBeNull()
  })

  it("propagates a non-404 loader failure instead of resolving null", async () => {
    const query = `{ cityGuideEvent(id: "london-art-week") { title } }`

    await expect(
      runQuery(
        query,
        loaders({
          cityGuideEventLoader: jest
            .fn()
            .mockRejectedValue(new HTTPError("Gravity down", 500)),
        })
      )
    ).rejects.toThrow("Gravity down")
  })

  it("resolves attached articles via a single Positron lookup", async () => {
    const articlesLoader = jest.fn().mockResolvedValue({
      results: [
        {
          id: "article-1",
          slug: "london-art-week-guide",
          title: "London Art Week Guide",
        },
      ],
    })
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          articles {
            internalID
            position
            article {
              internalID
              slug
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, loaders({ articlesLoader }))

    expect(articlesLoader).toHaveBeenCalledTimes(1)
    expect(articlesLoader).toHaveBeenCalledWith({ ids: ["article-1"] })
    expect(data.cityGuideEvent.articles).toEqual([
      {
        internalID: "article-join-1",
        position: 0,
        article: {
          internalID: "article-1",
          slug: "london-art-week-guide",
          title: "London Art Week Guide",
        },
      },
    ])
  })

  it("resolves an empty articles list without calling Positron", async () => {
    const articlesLoader = jest.fn().mockResolvedValue({ results: [] })
    const query = `{ cityGuideEvent(id: "london-art-week") { articles { internalID } } }`

    const data = await runQuery(
      query,
      loaders({
        cityGuideEventLoader: jest
          .fn()
          .mockResolvedValue({ ...gravityCityGuideEvent, articles: [] }),
        articlesLoader,
      })
    )

    expect(articlesLoader).not.toHaveBeenCalled()
    expect(data.cityGuideEvent.articles).toEqual([])
  })

  it("resolves video as null when the event has no video", async () => {
    const query = `{ cityGuideEvent(id: "london-art-week") { video { internalID } } }`

    const data = await runQuery(query, loaders())

    expect(data.cityGuideEvent.video).toBeNull()
  })

  it("resolves the attached video directly from the embedded Gravity payload", async () => {
    const query = `
      {
        cityGuideEvent(id: "london-art-week") {
          video {
            internalID
            title
            playerUrl
          }
        }
      }
    `

    const data = await runQuery(
      query,
      loaders({
        cityGuideEventLoader: jest.fn().mockResolvedValue({
          ...gravityCityGuideEvent,
          video: {
            _id: "video-1",
            title: "London Art Week trailer",
            description: null,
            player_embed_url: "https://player.vimeo.com/video/123",
            height: 1080,
            width: 1920,
            aspect_ratio: 1.78,
            created_at: "2026-08-01T09:00:00Z",
            updated_at: "2026-08-01T09:00:00Z",
          },
        }),
      })
    )

    expect(data.cityGuideEvent.video).toEqual({
      internalID: "video-1",
      title: "London Art Week trailer",
      playerUrl: "https://player.vimeo.com/video/123",
    })
  })
})
