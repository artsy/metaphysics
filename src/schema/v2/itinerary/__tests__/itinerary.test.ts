import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const gravityItinerary = {
  id: "b0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
  slug: "chill-vibes-only",
  user_id: "user-1",
  city_slug: "london-united-kingdom",
  title: "Chill Vibes Only",
  subtitle: "Take it slow",
  description: "A gentle day.",
  author_name: "Casey Lesser",
  is_curated: true,
  visibility: "public",
  published_at: "2026-08-01T09:00:00Z",
  published_by_id: "editor-1",
  share_token: null,
  sections_count: 1,
  image_url:
    "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/:version.jpg",
  image_urls: {
    large:
      "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/large.jpg",
    small:
      "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/small.jpg",
  },
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-02T09:00:00Z",
  sections: [
    {
      id: "section-1",
      itinerary_id: "b0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
      title: "Morning",
      note: "Start early, the galleries are empty before noon.",
      position: 0,
      stops_count: 3,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
      stops: [
        {
          id: "stop-1",
          itinerary_section_id: "section-1",
          position: 0,
          item_type: "PartnerShow",
          item_id: "show-1",
          event_type: "PartnerShowEvent",
          event_id: "event-1",
          title: null,
          address: null,
          image_url: null,
          latitude: null,
          longitude: null,
          start_at: "2026-09-12T10:00:00Z",
          end_at: "2026-09-12T11:00:00Z",
          time_zone: "Europe/London",
          note: null,
          category: "SHOW",
          is_free_admission: true,
          source_url: "https://example.com/source",
          created_at: "2026-08-01T09:00:00Z",
          updated_at: "2026-08-01T09:00:00Z",
        },
        {
          id: "stop-2",
          itinerary_section_id: "section-1",
          position: 1,
          item_type: "PartnerLocation",
          item_id: "location-1",
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
          category: "GALLERY",
          is_free_admission: null,
          source_url: null,
          created_at: "2026-08-01T09:00:00Z",
          updated_at: "2026-08-01T09:00:00Z",
        },
        {
          id: "stop-3",
          itinerary_section_id: "section-1",
          position: 2,
          item_type: null,
          item_id: null,
          event_type: null,
          event_id: null,
          title: "Coffee at Monmouth",
          address: "2 Park Street, London SE1 9AB",
          image_url: null,
          latitude: 51.5055,
          longitude: -0.0911,
          start_at: null,
          end_at: null,
          time_zone: null,
          note: "Queue moves faster than it looks.",
          category: null,
          is_free_admission: null,
          source_url: null,
          created_at: "2026-08-01T09:00:00Z",
          updated_at: "2026-08-01T09:00:00Z",
        },
      ],
    },
  ],
}

const loaders = () => ({
  itineraryLoader: jest.fn().mockResolvedValue(gravityItinerary),
  showsLoader: jest.fn().mockResolvedValue([{ _id: "show-1" }]),
  partnerLocationsByIdsLoader: jest
    .fn()
    .mockResolvedValue([{ id: "location-1", city: "London" }]),
  fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
})

describe("Itinerary", () => {
  it("maps Gravity's payload onto the type", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          internalID
          slug
          title
          subtitle
          authorName
          citySlug
          isCurated
          visibility
          sectionsCount
          sections {
            title
            note
            position
            stopsCount
            stops {
              position
              title
              address
              category
              isFreeAdmission
              timeZone
              sourceURL
              eventType
              eventID
            }
          }
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.itinerary.title).toEqual("Chill Vibes Only")
    expect(data.itinerary.slug).toEqual("chill-vibes-only")
    expect(data.itinerary.authorName).toEqual("Casey Lesser")
    expect(data.itinerary.citySlug).toEqual("london-united-kingdom")
    expect(data.itinerary.isCurated).toEqual(true)
    expect(data.itinerary.visibility).toEqual("PUBLIC")

    const section = data.itinerary.sections[0]
    expect(section.note).toEqual(
      "Start early, the galleries are empty before noon."
    )

    const [show, gallery, custom] = section.stops
    expect(show.timeZone).toEqual("Europe/London")
    expect(show.sourceURL).toEqual("https://example.com/source")
    expect(show.eventType).toEqual("PartnerShowEvent")
    expect(show.eventID).toEqual("event-1")
    expect(gallery.category).toEqual("GALLERY")
    expect(custom.title).toEqual("Coffee at Monmouth")
    expect(custom.address).toEqual("2 Park Street, London SE1 9AB")
  })

  // Gravity sends `image_urls` keyed by version but no `image_versions`.
  it("derives the image versions from the URL hash", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          heroImage {
            versions
            url(version: "small")
          }
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.itinerary.heroImage.versions).toEqual(["large", "small"])
    expect(data.itinerary.heroImage.url).toEqual(
      "https://d32dm0rphc51dk.cloudfront.net/9f8e7d6c5b4a3f2e1d0c9b8a/small.jpg"
    )
  })

  it("resolves each stop's item through the batched loaders", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections { stops { item { __typename } } }
        }
      }
    `

    const context = loaders()
    const data = await runQuery(query, context)

    const typenames = data.itinerary.sections[0].stops.map(
      (stop) => stop.item?.__typename ?? null
    )
    expect(typenames).toEqual(["Show", "Location", null])
    expect(context.partnerLocationsByIdsLoader).toHaveBeenCalledWith({
      id: ["location-1"],
      size: 1,
    })
  })

  it("resolves null on a Gravity 404", async () => {
    const query = `{ itinerary(id: "nope") { title } }`

    const data = await runQuery(query, {
      itineraryLoader: jest
        .fn()
        .mockRejectedValue(new HTTPError("Not Found", 404)),
    })

    expect(data.itinerary).toBeNull()
  })

  it("propagates a non-404 loader failure instead of resolving null", async () => {
    const query = `{ itinerary(id: "chill-vibes-only") { title } }`

    await expect(
      runQuery(query, {
        itineraryLoader: jest
          .fn()
          .mockRejectedValue(new HTTPError("Gravity down", 500)),
      })
    ).rejects.toThrow("Gravity down")
  })

  it("passes a share token through to Gravity", async () => {
    const query = `
      {
        itinerary(id: "some-id", shareToken: "tok") { title }
      }
    `

    const context = loaders()
    await runQuery(query, context)

    expect(context.itineraryLoader).toHaveBeenCalledWith("some-id", {
      share_token: "tok",
    })
  })
})
