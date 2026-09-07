import { runQuery } from "schema/v2/test/utils"
import config from "config"

describe("Itinerary", () => {
  it("resolves a fixture itinerary by internal ID", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          internalID
          slug
          name
          citySlug
          isCurated
          visibility
          sectionsCount
          sections {
            title
            position
            stopsCount
            stops {
              position
              title
              category
              isFreeAdmission
              item {
                __typename
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query)

    expect(data.itinerary.name).toEqual("Chill Vibes Only")
    expect(data.itinerary.slug).toEqual("chill-vibes-only")
    expect(data.itinerary.citySlug).toEqual("london-united-kingdom")
    expect(data.itinerary.isCurated).toEqual(true)
    expect(data.itinerary.visibility).toEqual("PUBLIC")
    expect(data.itinerary.sectionsCount).toEqual(3)
    expect(data.itinerary.sections).toHaveLength(3)
    expect(data.itinerary.sections[0].stops).toHaveLength(4)
    // Stop with no item reference (the coffee stop)
    expect(data.itinerary.sections[0].stops[0].item).toBeNull()
  })

  it("wires attachStopItems in: a stop's item resolves via the batched loader", async () => {
    const query = `
      {
        itinerary(id: "must-sees-and-hidden-gems") {
          sections {
            stops {
              item {
                __typename
                ... on Partner {
                  internalID
                }
              }
            }
          }
        }
      }
    `

    const partnersLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "white-cube" }],
      headers: {},
    })

    const data = await runQuery(query, { partnersLoader })

    // This would come back null on every stop if the root `itinerary`
    // field's resolver forgot to call `attachStopItems` before returning.
    expect(data.itinerary.sections[0].stops[0].item).toEqual({
      __typename: "Partner",
      internalID: "white-cube",
    })
  })

  it("resolves a fixture itinerary by slug", async () => {
    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          internalID
        }
      }
    `

    const data = await runQuery(query)

    expect(data.itinerary.internalID).toEqual("chill-vibes-only")
  })

  it("derives UNLISTED visibility from a share token with no published_at", async () => {
    const query = `
      {
        itinerary(id: "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b") {
          slug
          visibility
          shareToken
          authorName
        }
      }
    `

    const data = await runQuery(query)

    expect(data.itinerary.slug).toBeNull()
    expect(data.itinerary.visibility).toEqual("UNLISTED")
    expect(data.itinerary.shareToken).toEqual("sh_9f8e7d6c5b4a3f2e1d0c")
    expect(data.itinerary.authorName).toBeNull()
  })

  it("returns null when the fixture doesn't match", async () => {
    const query = `
      {
        itinerary(id: "does-not-exist") {
          internalID
        }
      }
    `

    const data = await runQuery(query)

    expect(data.itinerary).toBeNull()
  })

  it("returns null in production, where the fixture must not serve traffic", async () => {
    config.PRODUCTION_ENV = true

    const query = `
      {
        itinerary(id: "chill-vibes-only") {
          internalID
        }
      }
    `

    const data = await runQuery(query)

    expect(data.itinerary).toBeNull()

    config.PRODUCTION_ENV = false
  })
})
