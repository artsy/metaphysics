import { runAuthenticatedQuery, runQuery } from "test/utils"
import gql from "test/gql"

describe("when logged in", () => {
  it("makes a call for popular artists to the auth'd popularArtistsLoader", () => {
    const query = gql`
      {
        popular_artists {
          artists {
            id
          }
        }
      }
    `

    const rootValue = {
      authenticatedPopularArtistsLoader: () =>
        Promise.resolve([
          { birthday: "1900", artworks_count: 100, id: "ortina" },
          { birthday: "1900", artworks_count: 100, id: "xtina" },
        ]),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})

describe("when an anonymous user", () => {
  it("makes a call for popular artists to the popularArtistsLoader", () => {
    const query = gql`
      {
        popular_artists {
          artists {
            id
          }
        }
      }
    `

    const rootValue = {
      popularArtistsLoader: () =>
        Promise.resolve([
          { birthday: "1900", artworks_count: 100, id: "ortina" },
          { birthday: "1900", artworks_count: 100, id: "xtina" },
        ]),
    }

    expect.assertions(1)
    return runQuery(query, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
