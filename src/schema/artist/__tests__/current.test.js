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
        id: "contemporary-percy-z",
        name: "Catty Show",
      },
    ],
  }
  const relatedShowsLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(showsResponse))

  const salesResponse = [
    {
      live_start_at: "2018-12-28T12:00:00+00:00",
      id: "percy-z",
      name: "Catty Sale",
    },
  ]
  const relatedSalesLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(salesResponse))

  const rootValue = { artistLoader, relatedSalesLoader, relatedShowsLoader }

  it("returns a current sale", () => {
    const query = `
      {
        artist(id: "percy-z") {
          currentEvent {
            name
            status 
            details
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({ artist: { currentEvent: { name, status, details } } }) => {
        expect(name).toBe("Catty Sale")
        expect(status).toBe("Currently at auction")
        expect(details).toBe("Live bidding begins at Dec 28, 2018")
      }
    )
  })

  it("returns a current show", () => {
    rootValue.relatedSalesLoader = () => Promise.resolve([])
    const query = `
      {
        
        artist(id: "percy-z") {
          currentEvent {
            name
            status 
            details
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({ artist: { currentEvent: { name, status, details } } }) => {
        expect(name).toBe("Catty Show")
        expect(status).toBe("Currently on view")
        expect(details).toMatch(/Catty Partner/)
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
