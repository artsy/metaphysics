import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partnerArtistDocumentsConnection", () => {
  let response
  let context

  beforeEach(() => {
    response = [
      {
        uri: "partner/name/filename-one.pdf",
        filename: "filename-one.pdf",
        title: "File One",
      },
      {
        uri: "partner/name/filename-two.pdf",
        filename: "filename-two.png",
        title: "File Two",
      },
      {
        uri: "partner/name/filename-three.pdf",
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

  it("returns public links", async () => {
    const query = gql`
      {
        partnerArtistDocumentsConnection(
          artistID: "artistID"
          partnerID: "partnerID"
          first: 3
        ) {
          edges {
            node {
              publicUrl
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    const edges = data.partnerArtistDocumentsConnection.edges

    expect(edges[0].node.publicUrl).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-one.pdf"
    )
    expect(edges[1].node.publicUrl).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-two.pdf"
    )
    expect(edges[2].node.publicUrl).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-three.pdf"
    )
  })
})
