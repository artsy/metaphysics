import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"
import { createBatchItineraryStopMembershipsLoader } from "lib/loaders/batchItineraryStopMembershipsLoader"
import { graphql } from "graphql"
import { toGlobalId } from "graphql-relay"
import gql from "lib/gql"

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
  featured: true,
  visibility: "public",
  published_at: "2026-08-01T09:00:00Z",
  published_by_id: "editor-1",
  share_token: null,
  sections_count: 1,
  stops_count: 3,
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
  describe("stop memberships", () => {
    const query = gql`
      query Memberships($details: Boolean!) {
        itinerary(id: "guide") {
          sections {
            stops {
              internalID
              saved: isOnMyItineraries
              ...MembershipDetails
            }
          }
        }
      }
      fragment MembershipDetails on ItineraryStop {
        myItineraries @include(if: $details) {
          internalID
          title
          stopsCount
          sections {
            internalID
            stops {
              internalID
            }
          }
        }
      }
    `
    const setup = () => {
      const fetch = jest.fn(async ({ stops, include_itineraries }) =>
        JSON.parse(stops).map((stop) => ({
          is_on_my_itineraries: stop.item_id === "show-1",
          ...(include_itineraries
            ? {
                my_itineraries:
                  stop.item_id === "show-1" ? [gravityItinerary] : [],
              }
            : {}),
        }))
      )
      return {
        fetch,
        context: {
          ...loaders(),
          itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
            fetch
          ),
        },
      }
    }

    it("batches all stop booleans in one lightweight Gravity request", async () => {
      const { fetch, context } = setup()
      const data = await runQuery(query, context, { details: false })
      expect(
        data.itinerary.sections[0].stops.map((stop) => stop.saved)
      ).toEqual([true, false, false])
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][0].include_itineraries).toBe(false)
    })

    it("loads details on demand through fragments, aliases and directives", async () => {
      const { fetch, context } = setup()
      const data = await runQuery(query, context, { details: true })
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][0].include_itineraries).toBe(true)
      expect(
        data.itinerary.sections[0].stops[0].myItineraries[0]
      ).toMatchObject({
        internalID: gravityItinerary.id,
        title: gravityItinerary.title,
        stopsCount: 3,
        sections: [
          {
            internalID: "section-1",
            stops: [
              { internalID: "stop-1" },
              { internalID: "stop-2" },
              { internalID: "stop-3" },
            ],
          },
        ],
      })
      expect(context.showsLoader).toHaveBeenCalledTimes(1)
    })

    it("returns every matching stop ID grouped by itinerary", async () => {
      const matchingStop = gravityItinerary.sections[0].stops[0]
      const duplicate = { ...matchingStop, id: "duplicate-stop" }
      const matchingItinerary = {
        ...gravityItinerary,
        id: "owned-itinerary",
        sections: [
          {
            ...gravityItinerary.sections[0],
            stops: [matchingStop],
          },
          {
            ...gravityItinerary.sections[0],
            id: "section-2",
            stops: [duplicate, gravityItinerary.sections[0].stops[1]],
          },
        ],
      }
      const data = await runQuery(
        gql`
          {
            itinerary(id: "guide") {
              sections {
                stops {
                  myItineraryStopMemberships {
                    itineraryID
                    stopIDs
                  }
                }
              }
            }
          }
        `,
        {
          ...loaders(),
          itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
            jest.fn(async ({ stops }) =>
              JSON.parse(stops).map((stop) => ({
                is_on_my_itineraries: stop.item_id === "show-1",
                my_itineraries:
                  stop.item_id === "show-1" ? [matchingItinerary] : [],
              }))
            )
          ),
        }
      )

      expect(
        data.itinerary.sections[0].stops[0].myItineraryStopMemberships
      ).toEqual([
        {
          itineraryID: "owned-itinerary",
          stopIDs: [matchingStop.id, duplicate.id],
        },
      ])
    })

    it("makes no membership calls if neither field is selected", async () => {
      const { fetch, context } = setup()
      await runQuery(
        gql`
          {
            itinerary(id: "guide") {
              sections {
                stops {
                  title
                }
              }
            }
          }
        `,
        context
      )
      expect(fetch).not.toHaveBeenCalled()
    })

    it("batches nested item hydration across different stops' matching itineraries", async () => {
      const context = {
        ...loaders(),
        itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
          jest.fn(async ({ stops }) =>
            JSON.parse(stops).map((_, index) => ({
              is_on_my_itineraries: true,
              my_itineraries: [
                {
                  ...gravityItinerary,
                  id: `owned-${index}`,
                  sections: [
                    {
                      ...gravityItinerary.sections[0],
                      stops: [
                        {
                          ...gravityItinerary.sections[0].stops[0],
                          item_id: `nested-show-${index}`,
                          event_type: null,
                          event_id: null,
                        },
                      ],
                    },
                  ],
                },
              ],
            }))
          )
        ),
      }
      context.showsLoader.mockImplementation(async ({ id }) =>
        id.map((_id) => ({ _id }))
      )
      const result = await runQuery(
        gql`
          {
            itinerary(id: "guide") {
              sections {
                stops {
                  myItineraries {
                    sections {
                      stops {
                        item {
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
          }
        `,
        context
      )
      expect(context.showsLoader).toHaveBeenCalledTimes(2)
      expect(context.showsLoader).toHaveBeenLastCalledWith({
        id: ["nested-show-0", "nested-show-1", "nested-show-2"],
        size: 3,
        include_local_discovery: true,
      })
      expect(
        result.itinerary.sections[0].stops[0].myItineraries[0].sections[0]
          .stops[0].item.internalID
      ).toBe("nested-show-0")
    })

    it("returns false and empty lists when signed out", async () => {
      const data = await runQuery(query, loaders(), { details: true })
      expect(
        data.itinerary.sections[0].stops.every(
          (stop) => stop.saved === false && stop.myItineraries.length === 0
        )
      ).toBe(true)
    })

    it("retains stops when membership lookup fails", async () => {
      const { schema } = require("schema/v2")
      const result = await graphql({
        schema,
        source: query,
        variableValues: { details: true },
        contextValue: {
          ...loaders(),
          itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
            jest.fn().mockRejectedValue(new Error("Membership lookup failed"))
          ),
        },
      })
      expect(result.errors).toBeDefined()
      expect((result.data as any).itinerary.sections[0].stops[0]).toEqual({
        internalID: "stop-1",
        saved: null,
        myItineraries: null,
      })
    })
  })

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
          featured
          visibility
          sectionsCount
          sections {
            id
            title
            note
            position
            stopsCount
            stops {
              id
              position
              title
              address
              category
              isFreeAdmission
              timeZone
              sourceURL
              itemType
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
    expect(data.itinerary.featured).toEqual(true)
    expect(data.itinerary.visibility).toEqual("PUBLIC")

    const section = data.itinerary.sections[0]
    expect(section.id).toEqual(toGlobalId("ItinerarySection", "section-1"))
    expect(section.note).toEqual(
      "Start early, the galleries are empty before noon."
    )

    const [show, gallery, custom] = section.stops
    expect(show.id).toEqual(toGlobalId("ItineraryStop", "stop-1"))
    expect(show.timeZone).toEqual("Europe/London")
    expect(show.sourceURL).toEqual("https://example.com/source")
    expect(show.itemType).toEqual("SHOW")
    expect(show.eventType).toEqual("SHOW_EVENT")
    expect(show.eventID).toEqual("event-1")
    expect(gallery.category).toEqual("GALLERY")
    expect(custom.title).toEqual("Coffee at Monmouth")
    expect(custom.address).toEqual("2 Park Street, London SE1 9AB")
    expect(custom.itemType).toBeNull()
    expect(custom.eventType).toBeNull()
  })

  it("maps a non-public Gravity visibility value", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          visibility
        }
      }
    `

    const data = await runQuery(query, {
      ...loaders(),
      itineraryLoader: jest
        .fn()
        .mockResolvedValue({ ...gravityItinerary, visibility: "unlisted" }),
    })

    expect(data.itinerary.visibility).toEqual("UNLISTED")
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

  it("derives a stop's image versions from its URL hash", async () => {
    const stopItinerary = {
      ...gravityItinerary,
      sections: [
        {
          ...gravityItinerary.sections[0],
          stops: [
            {
              ...gravityItinerary.sections[0].stops[0],
              image_url:
                "https://d32dm0rphc51dk.cloudfront.net/stop-1/:version.jpg",
              image_urls: {
                large: "https://d32dm0rphc51dk.cloudfront.net/stop-1/large.jpg",
                small: "https://d32dm0rphc51dk.cloudfront.net/stop-1/small.jpg",
              },
            },
          ],
        },
      ],
    }

    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections { stops { image { url(version: "large") } } }
        }
      }
    `

    const data = await runQuery(query, {
      ...loaders(),
      itineraryLoader: jest.fn().mockResolvedValue(stopItinerary),
    })

    expect(data.itinerary.sections[0].stops[0].image.url).toEqual(
      "https://d32dm0rphc51dk.cloudfront.net/stop-1/large.jpg"
    )
  })

  it("is null until Gemini processing finishes", async () => {
    const stopItinerary = {
      ...gravityItinerary,
      sections: [
        {
          ...gravityItinerary.sections[0],
          stops: [
            {
              ...gravityItinerary.sections[0].stops[0],
              image_url: "https://picsum.photos/200",
              image_urls: null,
            },
          ],
        },
      ],
    }

    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections { stops { image { url } } }
        }
      }
    `

    const data = await runQuery(query, {
      ...loaders(),
      itineraryLoader: jest.fn().mockResolvedValue(stopItinerary),
    })

    expect(data.itinerary.sections[0].stops[0].image).toBeNull()
  })

  it("resolves null when a stop has no image", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections { stops { image { url } } }
        }
      }
    `

    const data = await runQuery(query, loaders())

    expect(data.itinerary.sections[0].stops[0].image).toBeNull()
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

  it("resolves the event a show stop names", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections {
            stops {
              event {
                __typename
                ... on ShowEventType { internalID }
                ... on FairEvent { internalID }
              }
            }
          }
        }
      }
    `

    const context = {
      ...loaders(),
      showsLoader: jest.fn().mockResolvedValue([
        {
          _id: "show-1",
          events: [{ _id: "event-1", title: "Opening Reception" }],
        },
      ]),
    }
    const data = await runQuery(query, context)

    const [show, gallery, custom] = data.itinerary.sections[0].stops
    expect(show.event).toEqual({
      __typename: "ShowEventType",
      internalID: "event-1",
    })
    expect(gallery.event).toBeNull()
    expect(custom.event).toBeNull()
  })

  it("resolves the event a fair stop names", async () => {
    const fairItinerary = {
      ...gravityItinerary,
      sections: [
        {
          ...gravityItinerary.sections[0],
          stops: [
            {
              ...gravityItinerary.sections[0].stops[0],
              item_type: "Fair",
              item_id: "fair-1",
              event_type: "FairEvent",
              event_id: "fair-event-1",
            },
          ],
        },
      ],
    }

    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          sections {
            stops {
              event {
                __typename
                ... on FairEvent { internalID name }
              }
            }
          }
        }
      }
    `

    const context = {
      ...loaders(),
      itineraryLoader: jest.fn().mockResolvedValue(fairItinerary),
      fairsLoader: jest
        .fn()
        .mockResolvedValue({ body: [{ _id: "fair-1" }], headers: {} }),
      fairEventsLoader: jest
        .fn()
        .mockResolvedValue([{ id: "fair-event-1", name: "Booth Talk" }]),
    }
    const data = await runQuery(query, context)

    const [stop] = data.itinerary.sections[0].stops
    expect(stop.event).toEqual({
      __typename: "FairEvent",
      internalID: "fair-event-1",
      name: "Booth Talk",
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
