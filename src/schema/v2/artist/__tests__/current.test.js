/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist type", () => {
  const artist = {
    id: "percy-z",
    birthday: "2012",
  }
  const artistLoader = () => Promise.resolve(artist)

  const showsResponse = {
    body: [
      {
        start_at: "2018-12-21T12:00:00+00:00",
        end_at: "2018-12-31T12:00:00+00:00",
        partner: {
          name: "Catty Partner",
        },
        id: "catty-show",
        name: "Catty Show",
        location: {
          city: "Quonochontaug",
        },
      },
    ],
  }
  const relatedShowsLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(showsResponse))

  const salesResponse = [
    {
      live_start_at: "2018-12-28T12:00:00+00:00",
      id: "catty-sale",
      name: "Catty Sale",
    },
  ]
  const relatedSalesLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(salesResponse))

  const context = { artistLoader, relatedSalesLoader, relatedShowsLoader }

  describe("with a current sale", () => {
    it("returns a live sale", () => {
      const query = `
      {
        artist(id: "percy-z") {
          currentEvent {
            status
            details
            name
            href
            event {
              __typename
              ... on Sale {
                slug
              }
            }
          }
        }
      }
    `

      return runQuery(query, context).then(
        ({
          artist: {
            currentEvent: { status, partner, details, name, href, event },
          },
        }) => {
          expect(name).toBe("Catty Sale")
          expect(status).toBe("Currently at auction")
          expect(details).toBe("Live bidding begins Dec 28 7:00 AM EST")
          expect(href).toBe("/auction/catty-sale")
          expect(event).toEqual({ __typename: "Sale", slug: "catty-sale" })
        }
      )
    })

    it("returns an online only sale", () => {
      const query = `
      {
        artist(id: "percy-z") {
          currentEvent {
            status
            details
            name
            href
            event {
              __typename
              ... on Sale {
                slug
              }
            }
          }
        }
      }
    `
      context.relatedSalesLoader = () =>
        Promise.resolve([
          {
            end_at: "2018-12-31T12:00:00+00:00",
            id: "catty-sale",
            name: "Catty Sale",
          },
        ])
      return runQuery(query, context).then(
        ({
          artist: {
            currentEvent: { status, partner, details, name, href, event },
          },
        }) => {
          expect(name).toBe("Catty Sale")
          expect(status).toBe("Currently at auction")
          expect(details).toBe("Bidding ends Dec 31 7:00 AM EST")
          expect(href).toBe("/auction/catty-sale")
          expect(event).toEqual({ __typename: "Sale", slug: "catty-sale" })
        }
      )
    })
  })

  it("returns a current show", () => {
    context.relatedSalesLoader = () => Promise.resolve([])
    const query = `
      {

        artist(id: "percy-z") {
          currentEvent {
            status
            details
            name
            href
            partner
            event {
              __typename
              ... on Show {
                slug
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          currentEvent: { name, status, details, href, partner, event },
        },
      }) => {
        expect(name).toBe("Catty Show")
        expect(status).toBe("Currently on view")
        expect(href).toBe("/show/catty-show")
        expect(partner).toBe("Catty Partner")
        expect(details).toBe("Quonochontaug, December 21 – 31, 2018")
        expect(event).toEqual({ __typename: "Show", slug: "catty-show" })
      }
    )
  })

  it("returns null when there is no current event", () => {
    context.relatedSalesLoader = () => Promise.resolve([])
    context.relatedShowsLoader = () => Promise.resolve({ body: [] })
    const query = `
      {
        artist(id: "percy-z") {
          currentEvent {
            name
          }
        }
      }
    `

    return runQuery(query, context).then(({ artist: { currentEvent } }) => {
      expect(currentEvent).toBeNull()
    })
  })
})
