import config from "config"
import { runQuery } from "schema/v2/test/utils"

describe("Algolia type", () => {
  it("exposes algolia application ID config", async () => {
    config.ALGOLIA_APP_ID = "id"

    const query = `
      {
        system {
          algolia {
            appID
          }
        }
      }
    `

    const { system } = await runQuery(query)
    expect(system.algolia.appID).toEqual("id")
  })
})
