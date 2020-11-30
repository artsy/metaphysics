import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { find } from "lodash"

const ARTIST_FIXTURE = {
  id: "han-myung-ok",
  name: "Han Myung-Ok",
  birthday: "1958",
  artworks_count: 12,
}

const ARTISTS_FIXTURE = [
  {
    id: "andy-warhol",
    name: "Andy Warhol",
    birthday: "1928",
    artworks_count: 6083,
  },
  {
    id: "pablo-picasso",
    name: "Pablo Picasso",
    birthday: "1881",
    artworks_count: 4836,
  },
]

describe("Artists", () => {
  it("returns a list of artists", async () => {
    const query = gql`
      {
        artists(page: 1, size: 1) {
          name
        }
      }
    `

    const artistsLoader = ({ page, size }: any) => {
      if (page === 1 && size === 1) {
        return Promise.resolve({
          body: [ARTIST_FIXTURE],
          headers: {},
        })
      }

      throw new Error("Unexpected invocation")
    }

    const { artists } = await runQuery(query, { artistsLoader })

    expect(artists).toEqual([{ name: "Han Myung-Ok" }])
  })

  it("returns a list of artists matching array of ids", async () => {
    const artistsLoader = ({ ids }: any) => {
      if (ids) {
        return Promise.resolve({
          body: ids.map((_id) => ({ _id })),
          headers: {},
        })
      }

      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        artists(ids: ["52c721e5b202a3edf1000072"]) {
          internalID
        }
      }
    `

    const { artists } = await runQuery(query, { artistsLoader })

    expect(artists[0].internalID).toEqual("52c721e5b202a3edf1000072")
  })

  it("returns a list of artists matching array of slugs", async () => {
    const artistLoader = (slug) => {
      if (slug) {
        return Promise.resolve(
          find(ARTISTS_FIXTURE, (item) => item.id === slug)
        )
      }

      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        artists(slugs: ["andy-warhol", "pablo-picasso"]) {
          slug
          name
        }
      }
    `

    const { artists } = await runQuery(query, { artistLoader })

    expect(artists[0].slug).toEqual("andy-warhol")
    expect(artists[1].slug).toEqual("pablo-picasso")
  })
})

describe("artistsConnection", () => {
  it("returns a list of artists", async () => {
    const query = gql`
      {
        artistsConnection(first: 1) {
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `

    const artistsLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [ARTIST_FIXTURE],
        headers: {
          "x-total-count": "1",
        },
      })
    )

    const { artistsConnection } = await runQuery(query, { artistsLoader })

    expect(artistsConnection).toEqual({
      pageInfo: { endCursor: "YXJyYXljb25uZWN0aW9uOjA=", hasNextPage: false },
      totalCount: 1,
      edges: [{ node: { name: "Han Myung-Ok" } }],
    })

    expect(artistsLoader).toBeCalledWith({
      page: 1,
      size: 1,
      total_count: true,
    })
  })

  it("returns a list of artists using page/size args", async () => {
    const query = gql`
      {
        artistsConnection(page: 1, size: 10) {
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `

    const artistsLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: ARTISTS_FIXTURE,
        headers: {
          "x-total-count": `${ARTISTS_FIXTURE.length}`,
        },
      })
    )

    const { artistsConnection } = await runQuery(query, { artistsLoader })

    expect(artistsConnection).toEqual({
      pageInfo: { endCursor: "YXJyYXljb25uZWN0aW9uOjE=", hasNextPage: false },
      totalCount: 2,
      edges: [
        { node: { name: "Andy Warhol" } },
        { node: { name: "Pablo Picasso" } },
      ],
    })

    expect(artistsLoader).toBeCalledWith({
      page: 1,
      size: 10,
      total_count: true,
    })
  })

  it("returns a list of artists matching an array of slugs", async () => {
    const query = gql`
      {
        artistsConnection(slugs: ["andy-warhol", "pablo-picasso"]) {
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `

    const artistLoader = jest.fn((id: string) => {
      return Promise.resolve(find(ARTISTS_FIXTURE, (item) => item.id === id))
    })

    const { artistsConnection } = await runQuery(query, { artistLoader })

    expect(artistsConnection).toEqual({
      pageInfo: { endCursor: "YXJyYXljb25uZWN0aW9uOjE=", hasNextPage: false },
      totalCount: 2,
      edges: [
        { node: { name: "Andy Warhol" } },
        { node: { name: "Pablo Picasso" } },
      ],
    })

    expect(artistLoader).toBeCalledTimes(2)
    expect(artistLoader).toHaveBeenNthCalledWith(
      1,
      "andy-warhol",
      {},
      { requestThrottleMs: 600000 }
    )
    expect(artistLoader).toHaveBeenNthCalledWith(
      2,
      "pablo-picasso",
      {},
      { requestThrottleMs: 600000 }
    )
  })

  it("returns a list of artists from the alphabetical endpoint when a letter is passed", async () => {
    const query = gql`
      {
        artistsConnection(first: 10, letter: "w") {
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `

    const artistsByLetterLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [ARTISTS_FIXTURE[0]],
        headers: {
          "x-total-count": "1",
        },
      })
    )

    const { artistsConnection } = await runQuery(query, {
      artistsByLetterLoader,
    })

    expect(artistsConnection).toEqual({
      pageInfo: { endCursor: "YXJyYXljb25uZWN0aW9uOjA=", hasNextPage: false },
      totalCount: 1,
      edges: [{ node: { name: "Andy Warhol" } }],
    })

    expect(artistsByLetterLoader).toBeCalledWith("w", {
      page: 1,
      size: 10,
      total_count: true,
    })
  })
})
