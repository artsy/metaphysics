import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FeaturesConnection", () => {
  it("uses the match loader when searching by term", async () => {
    const matchFeaturesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ description: "Foo fair" }, { description: "Foo bar fair" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        featuresConnection(term: "foo", first: 5) {
          totalCount
          edges {
            node {
              description
            }
          }
        }
      }
    `
    const { featuresConnection } = await runAuthenticatedQuery(query, {
      matchFeaturesLoader,
    })

    expect(matchFeaturesLoader).toBeCalledWith({
      term: "foo",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(featuresConnection.totalCount).toBe(2)
    expect(featuresConnection.edges[0].node.description).toEqual("Foo fair")
    expect(featuresConnection.edges[1].node.description).toEqual("Foo bar fair")
  })

  it("uses the features loader when not searching by term", async () => {
    const featuresLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [
          { description: "Foo feature" },
          { description: "Foo bar feature" },
        ],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        featuresConnection(first: 5) {
          totalCount
          edges {
            node {
              description
            }
          }
        }
      }
    `
    const { featuresConnection } = await runAuthenticatedQuery(query, {
      featuresLoader,
    })

    expect(featuresLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(featuresConnection.totalCount).toBe(2)
    expect(featuresConnection.edges[0].node.description).toEqual("Foo feature")
    expect(featuresConnection.edges[1].node.description).toEqual(
      "Foo bar feature"
    )
  })
})
