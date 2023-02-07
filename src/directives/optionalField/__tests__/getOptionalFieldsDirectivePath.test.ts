import { getOptionalFieldsDirectivePaths } from "../getOptionalFieldsDirectivePaths"
import { Source, parse } from "graphql"

const queryToAst = (query) => parse(new Source(query))

describe("getOptionalFieldsDirectivePaths", () => {
  it("returns an empty array when the directive is not used", () => {
    const query = `
      {
        artwork(id: "test")  {
          id
        }
        artist(id: "test") {
          id
        }
       article(id: "test") {
          id
        }
      }
    `

    const path = getOptionalFieldsDirectivePaths(queryToAst(query))

    expect(path).toEqual([])
  })

  it("returns the full path to the field tagged with the directive", () => {
    const query = `
      {
        artist(id: "test") {
          results: auctionResults(first: 1) @optionalField {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    const path = getOptionalFieldsDirectivePaths(queryToAst(query))
    expect(path).toEqual([["artist", "results"]])
  })

  it("returns the full path to the fields tagged with the directive", () => {
    const query = `
      {
        artwork(id: "test") @optionalField {
          id
        }
        artist(id: "test") {
          id
        }
        article(id: "test") {
          author @optionalField {
            name
          }
          id
        }
      }
    `

    const path = getOptionalFieldsDirectivePaths(queryToAst(query))
    expect(path).toEqual([["artwork"], ["article", "author"]])
  })
})
