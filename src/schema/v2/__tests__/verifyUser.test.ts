import { runQuery } from "../test/utils"

describe("veryifyUser", () => {
  it("resolves with `exists`", async () => {
    const query = `
    {
      verifyUser(email: "percy@cat.com", recaptchaToken: "token") {
        exists
      }
    }
  `

    const context = {
      userIdentificationLoader: () => {
        return Promise.resolve({ exists: true })
      },
    }

    const { verifyUser: result } = await runQuery(query, context)

    expect(result.exists).toBeTrue()
  })
})
