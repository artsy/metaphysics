/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

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

  const rootValue = { artistLoader, relatedSalesLoader, relatedShowsLoader }

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
                id
              }
            }
          }
        }
      }
    `

      return runQuery(query, rootValue).then(
        ({
          artist: {
            currentEvent: { status, partner, details, name, href, event },
          },
        }) => {
          expect(name).toBe("Catty Sale")
          expect(status).toBe("Currently at auction")
          expect(details).toBe("Live bidding begins Dec 28 7:00 AM EST")
          expect(href).toBe("/auction/catty-sale")
          expect(event).toEqual({ __typename: "Sale", id: "catty-sale" })
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
                id
              }
            }
          }
        }
      }
    `
      rootValue.relatedSalesLoader = () =>
        Promise.resolve([
          {
            end_at: "2018-12-31T12:00:00+00:00",
            id: "catty-sale",
            name: "Catty Sale",
          },
        ])
      return runQuery(query, rootValue).then(
        ({
          artist: {
            currentEvent: { status, partner, details, name, href, event },
          },
        }) => {
          expect(name).toBe("Catty Sale")
          expect(status).toBe("Currently at auction")
          expect(details).toBe("Bidding ends Dec 31 7:00 AM EST")
          expect(href).toBe("/auction/catty-sale")
          expect(event).toEqual({ __typename: "Sale", id: "catty-sale" })
        }
      )
    })
  })

  it("returns a current show", () => {
    rootValue.relatedSalesLoader = () => Promise.resolve([])
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
                id
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          currentEvent: { name, status, details, href, partner, event },
        },
      }) => {
        expect(name).toBe("Catty Show")
        expect(status).toBe("Currently on view")
        expect(href).toBe("/show/catty-show")
        expect(partner).toBe("Catty Partner")
        expect(details).toBe("Quonochontaug, Dec 21 – 31")
        expect(event).toEqual({ __typename: "Show", id: "catty-show" })
      }
    )
  })

  it("returns null when there is no current event", () => {
    rootValue.relatedSalesLoader = () => Promise.resolve([])
    rootValue.relatedShowsLoader = () => Promise.resolve({ body: [] })
    const query = `
      {
        artist(id: "percy-z") {
          currentEvent {
            name
          }
        }
      }
    `

    return runQuery(query, rootValue).then(({ artist: { currentEvent } }) => {
      expect(currentEvent).toBeNull()
    })
  })
})
