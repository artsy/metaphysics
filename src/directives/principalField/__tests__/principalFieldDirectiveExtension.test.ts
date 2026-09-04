import { graphql, parse } from "graphql"
import { HTTPError } from "lib/HTTPError"
import { principalFieldDirectiveExtension } from "../principalFieldDirectiveExtension"

describe("principalFieldDirectiveExtension", () => {
  it("surfaces the HTTP status code when the @principalField loader rejects with an HTTPError", async () => {
    const { schema } = require("schema/v2")

    const query = `
      {
        viewingRoom(id: "some-deleted-viewing-room") @principalField {
          internalID
        }
      }
    `

    const result = await graphql({
      schema,
      source: query,
      contextValue: {
        viewingRoomLoader: () =>
          Promise.reject(
            new HTTPError(
              "Not Found",
              404,
              "Viewing Room Not Found: some-deleted-viewing-room"
            )
          ),
      },
    })

    expect(result.errors).toBeTruthy()

    const extensions = principalFieldDirectiveExtension(parse(query), result)

    expect(extensions).toEqual({
      principalField: {
        httpStatusCode: 404,
      },
    })
  })
})
