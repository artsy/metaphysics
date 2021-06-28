import { graphql, parse, Source } from "graphql"
import { HTTPError } from "lib/HTTPError"
import { optionalFieldsDirectiveExtension } from "extensions/optionalFieldsDirectiveExtension"

const { schema } = require("schema/v2")
const queryToAst = (query) => parse(new Source(query))

describe("optionalFieldsDirectiveExtension", () => {
  it("returns the underlying errors when occurring on a tagged field", async () => {
    const query = `
      {
        artwork(id: "test") @optionalField {
          id
        }
        artist(id: "test") {
          id
        }
        article(id: "test") @optionalField {
          author {
            name
          }
          id
        }
      }
    `

    const args = {
      schema,
      source: query,
      contextValue: {
        artworkLoader: () => Promise.reject(new HTTPError("not found", 404)),
        artistLoader: () => Promise.reject(new HTTPError("not found", 404)),
        articleLoader: () => Promise.resolve(new HTTPError("not found", 404)),
      },
    }

    const result = await graphql(args)
    const extensions = optionalFieldsDirectiveExtension(
      queryToAst(query),
      result
    )

    expect(extensions).toEqual({
      optionalFields: [
        { httpStatusCode: 404, path: ["artwork"] },
        { httpStatusCode: 404, path: ["article"] },
      ],
    })
  })

  it("doesnt return an error when the error is on a different field", async () => {
    const query = `
      {
        artwork(id: "test") @optionalField {
          title
        }
        article(id: "test") {
          href
        }
      }
    `

    const args = {
      schema,
      source: query,
      contextValue: {
        articleLoader: () => Promise.reject(new HTTPError("not found", 404)),
        artworkLoader: () => Promise.resolve({ title: "percy-z" }),
      },
    }

    const result = await graphql(args)
    const { data } = result

    expect(data!.artwork.title).toEqual("percy-z")

    const extensions = optionalFieldsDirectiveExtension(
      queryToAst(query),
      result
    )

    expect(extensions).toEqual({})
  })
})
