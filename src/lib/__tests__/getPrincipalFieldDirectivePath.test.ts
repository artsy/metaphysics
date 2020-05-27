import { getPrincipalFieldDirectivePath } from "../getPrincipalFieldDirectivePath"
import { Source, parse } from "graphql"

const queryToAst = (query) => parse(new Source(query))

describe(getPrincipalFieldDirectivePath, () => {
  it("returns an empty array when the directive is not used", () => {
    const query = `
      {
        artwork(id: "test") {
          id
        }
      }
    `

    const path = getPrincipalFieldDirectivePath(queryToAst(query))
    expect(path.length).toBeFalsy()
  })

  it("returns the full path to the field tagged with the directive", () => {
    const query = `
      {
        artist(id: "test") {
          results: auctionResults(first: 1) @principalField {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    const path = getPrincipalFieldDirectivePath(queryToAst(query))
    expect(path).toEqual(["artist", "results"])
  })
})
