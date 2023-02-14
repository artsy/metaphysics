import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("markdownContent", () => {
  const query = gql`
    {
      markdown(content: "**cats**") {
        content(format: HTML)
      }
    }
  `

  it("without a token, errors", async () => {
    expect.assertions(1)
    await expect(runQuery(query)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("with an invalid token, errors", async () => {
    const meLoader = () => Promise.reject(new Error("Invalid token"))
    expect.assertions(1)
    await expect(runAuthenticatedQuery(query, { meLoader })).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("with a valid token w/o the `content_manager` role, errors", async () => {
    const meLoader = () => Promise.resolve({ roles: [] })
    expect.assertions(1)
    await expect(runAuthenticatedQuery(query, { meLoader })).rejects.toThrow(
      "You need to have the `content_manager` role to perform this action"
    )
  })

  it("with the `content_manager` role, returns data", async () => {
    const meLoader = () => Promise.resolve({ roles: ["content_manager"] })
    const data = await runAuthenticatedQuery(query, { meLoader })
    expect(data.markdown.content).toInclude("<strong>cats</strong>")
  })
})
