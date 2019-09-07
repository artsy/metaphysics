import { graphql, parse, Source } from "graphql"
import { HTTPError } from "lib/HTTPError"
import { canonicalResourceDirectiveExtension } from "extensions/canonicalResourceDirectiveExtension"

const schema = require("schema/v1").default
const queryToAst = query => parse(new Source(query))

describe(canonicalResourceDirectiveExtension, () => {
  it("returns the underlying error when occurring on a tagged field", async () => {
    const query = `
      {
        artwork(id: "test") @canonicalResource {
          id
        }
      }
    `

    const args = {
      schema,
      source: query,
      contextValue: {
        artworkLoader: () => Promise.reject(new HTTPError("not found", 404)),
      },
    }

    const result = await graphql(args)
    const extensions = canonicalResourceDirectiveExtension(
      queryToAst(query),
      result
    )
    expect(extensions).toEqual({ canonicalResource: { httpStatusCode: 404 } })
  })
})
