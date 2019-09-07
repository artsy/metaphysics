import { getCanonicalResourceDirectiveForField } from "../getCanonicalResourceDirectiveField"
import { Source, parse } from "graphql"

const queryToAst = query => parse(new Source(query))

describe(getCanonicalResourceDirectiveForField, () => {
  it("returns an empty array when the directive is not used", () => {
    const query = `
      {
        artwork(id: "test") {
          id
        }
      }
    `

    const path = getCanonicalResourceDirectiveForField(queryToAst(query))
    expect(path.length).toBeFalsy()
  })

  it("returns the full path to the field tagged with the directive", () => {
    const query = `
      {
        artist(id: "test") {
          results: auctionResults(first: 1) @canonicalResource {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    const path = getCanonicalResourceDirectiveForField(queryToAst(query))
    expect(path).toEqual(["artist", "results"])
  })
})
