import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("UserFlags", () => {
    it("returns the userFlags including automatically injected flags", async () => {
      const query = `
        {
          me {
            profession
            userFlags
          }
        }
      `
      const collectorProfile = {
        id: "3",
        name: "Mickey",
        bio: "biooooo",
        icon: "icon",
        otherRelevantPositions: null,
      }

      const loaders = {
        collectorProfileLoader: () => Promise.resolve(collectorProfile),
        meLoader: () => Promise.resolve({ profession: "dev" }),
      }

      const data = await runAuthenticatedQuery(query, loaders)
      const injectedFlag = "collectorProfileIncompleteAt"
      expect(data.me.userFlags[injectedFlag]).not.toBe(undefined)
    })
  })
})
