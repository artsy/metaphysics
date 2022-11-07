import { runQuery } from "schema/v2/test/utils"

describe("HomePageMyCollectionOnboardingModule", () => {
  it("shows cards if the user has more than 3 artworks in collection", async () => {
    const query = `
    {
      homePage {
        onboardingModule {
          showMyCollectionCard
          showSWACard
        }
      }
    }
  `

    const response = await runQuery(query, {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      collectionLoader: () =>
        Promise.resolve({
          artworks_count: 10,
        }),
    })

    const results = {
      homePage: {
        onboardingModule: {
          showMyCollectionCard: response,
          showSWACard: response,
        },
      },
    }
    expect(results.homePage.onboardingModule.showMyCollectionCard).toBeTruthy()
    expect(results.homePage.onboardingModule.showSWACard).toBeTruthy()
  })
})
