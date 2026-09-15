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
})
