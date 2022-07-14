import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partnerArtistDocumentsConnection", () => {
  let response
  let context

  beforeEach(() => {
    response = [
      {
        filename: "filename-one.pdf",
        title: "File One",
      },
      {
        filename: "filename-two.png",
        title: "File Two",
      },
      {
        filename: "filename-three.jpg",
        title: "File Three",
      },
    ]

    context = {
      partnerArtistDocumentsLoader: () => {
        return Promise.resolve({
          body: response,
          headers: {
            "x-total-count": response.length,
          },
        })
      },
    }
  })

  it("returns artist documents", async () => {
    const query = gql`
      {
        partnerArtistDocumentsConnection(
          artistID: "artistID"
          partnerID: "partnerID"
          first: 5
        ) {
          edges {
            node {
              filename
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partnerArtistDocumentsConnection: {
        edges: [
          {
            node: {
              filename: "filename-one.pdf",
              title: "File One",
            },
          },
          {
            node: {
              filename: "filename-two.png",
              title: "File Two",
            },
          },
          {
            node: {
              filename: "filename-three.jpg",
              title: "File Three",
            },
          },
        ],
      },
    })
  })

  it("returns hasNextPage=true when first is below total", async () => {
    const query = gql`
      {
        partnerArtistDocumentsConnection(
          artistID: "artistID"
          partnerID: "partnerID"
          first: 1
        ) {
          pageInfo {
            hasNextPage
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partnerArtistDocumentsConnection: {
        pageInfo: {
          hasNextPage: true,
        },
      },
    })
  })

  it("returns hasNextPage=false when first is above total", async () => {
    const query = gql`
      {
        partnerArtistDocumentsConnection(
          artistID: "artistID"
          partnerID: "partnerID"
          first: 3
        ) {
          pageInfo {
            hasNextPage
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partnerArtistDocumentsConnection: {
        pageInfo: {
          hasNextPage: false,
        },
      },
    })
  })

  it("loads the total count", async () => {
    const query = gql`
      {
        partnerArtistDocumentsConnection(
          artistID: "artistID"
          partnerID: "partnerID"
          first: 3
        ) {
          totalCount
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partnerArtistDocumentsConnection: {
        totalCount: 3,
      },
    })
  })
})
