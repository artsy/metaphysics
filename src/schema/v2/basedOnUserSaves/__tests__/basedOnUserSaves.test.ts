import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("basedOnUserSaves", () => {
  it("returns artworks", async () => {
    const query = gql`
      {
        basedOnUserSaves(userId: "user-id", first: 2) {
          edges {
            node {
              internalID
              slug
            }
          }
        }
      }
    `

    const savedArtworksResponse = {
      body: [
        {
          _id: "saved-artwork-1",
          id: "artwork-1",
          slug: "artwork-1-slug",
        },
        {
          _id: "saved-artwork-2",
          id: "artwork-2",
          slug: "artwork-2-slug",
        },
        {
          _id: "saved-artwork-3",
          id: "artwork-3",
          slug: "artwork-3-slug",
        },
      ],
    }

    const similarArtworksResponse = [
      {
        _id: "similar-artwork-1",
        id: "similar-artwork-1",
        slug: "similar-artwork-1-slug",
      },
      {
        _id: "similar-artwork-2",
        id: "similar-artwork-2",
        slug: "similar-artwork-2-slug",
      },
    ]

    const savedArtworksLoader = jest.fn(async () => savedArtworksResponse)
    const similarArtworksLoader = jest.fn(async () => similarArtworksResponse)

    const context: any = {
      accessToken: "424242",
      savedArtworksLoader,
      similarArtworksLoader,
      userID: "user-id",
    }

    const response = await runQuery(query, context)

    expect(savedArtworksLoader).toHaveBeenCalledWith({
      size: 3,
      sort: "-position",
      user_id: "user-id",
      private: true,
    })

    expect(similarArtworksLoader).toHaveBeenCalledWith({
      artwork_id: ["saved-artwork-1", "saved-artwork-2", "saved-artwork-3"],
      for_sale: true,
      size: 2,
      offset: 0,
      total_count: true,
    })

    expect(response).toMatchInlineSnapshot(`
      {
        "basedOnUserSaves": {
          "edges": [
            {
              "node": {
                "internalID": "similar-artwork-1",
                "slug": "similar-artwork-1",
              },
            },
            {
              "node": {
                "internalID": "similar-artwork-2",
                "slug": "similar-artwork-2",
              },
            },
          ],
        },
      }
    `)
  })

  it("returns null when user has no saved artworks", async () => {
    const query = gql`
      {
        basedOnUserSaves(userId: "user-id", first: 2) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `

    const savedArtworksResponse = {
      body: [],
    }

    const savedArtworksLoader = jest.fn(async () => savedArtworksResponse)
    const similarArtworksLoader = jest.fn()

    const context: any = {
      accessToken: "424242",
      savedArtworksLoader,
      similarArtworksLoader,
      userID: "user-id",
    }

    const response = await runQuery(query, context)

    expect(savedArtworksLoader).toHaveBeenCalledWith({
      size: 3,
      sort: "-position",
      user_id: "user-id",
      private: true,
    })

    expect(similarArtworksLoader).not.toHaveBeenCalled()
    expect(response).toMatchInlineSnapshot(`
      {
        "basedOnUserSaves": null,
      }
    `)
  })
})
