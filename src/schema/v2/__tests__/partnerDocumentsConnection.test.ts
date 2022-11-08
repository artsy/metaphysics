import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partner.documentsConnection", () => {
  let response
  let context

  beforeEach(() => {
    response = [
      {
        uri: "partner/name/filename-one.pdf",
        title: "File One",
      },
      {
        uri: "partner/name/filename-two.pdf",
        title: "File Two",
      },
      {
        uri: "partner/name/filename-three.pdf",
        title: "File Three",
      },
    ]
    const documentsLoader = () => {
      return Promise.resolve({
        body: response,
        headers: {
          "x-total-count": response.length,
        },
      })
    }

    context = {
      partnerLoader: () => {
        return Promise.resolve({
          _id: "partnerID",
        })
      },
      partnerDocumentsLoader: documentsLoader,
      partnerArtistDocumentsLoader: documentsLoader,
      partnerShowDocumentsLoader: documentsLoader,
    }
  })

  it("returns documents", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          documentsConnection(first: 5) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        documentsConnection: {
          edges: [
            {
              node: {
                title: "File One",
              },
            },
            {
              node: {
                title: "File Two",
              },
            },
            {
              node: {
                title: "File Three",
              },
            },
          ],
        },
      },
    })
  })

  it("returns hasNextPage=true when first is below total", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          documentsConnection(first: 1) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        documentsConnection: {
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("returns hasNextPage=false when first is above total", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          documentsConnection(first: 3) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        documentsConnection: {
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    })
  })

  it("loads the total count", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          documentsConnection(first: 3) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        documentsConnection: {
          totalCount: 3,
        },
      },
    })
  })

  it("returns public links", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          documentsConnection(first: 3) {
            edges {
              node {
                publicURL
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    const edges = data.partner.documentsConnection.edges

    expect(edges[0].node.publicURL).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-one.pdf"
    )
    expect(edges[1].node.publicURL).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-two.pdf"
    )
    expect(edges[2].node.publicURL).toBe(
      "https://api.artsy.test/api/v1/partner/name/filename-three.pdf"
    )
  })
})
