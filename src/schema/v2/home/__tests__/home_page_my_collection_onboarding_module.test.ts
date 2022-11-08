import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

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

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),

      collectionLoader: () => {
        return Promise.resolve({
          artworks_count: 10,
        })
      },
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      Object {
        "homePage": Object {
          "onboardingModule": Object {
            "showMyCollectionCard": false,
            "showSWACard": false,
          },
        },
      }
    `)
  })

  it("doesn't show cards if the user has less than 3 artworks in collection", async () => {
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

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),

      collectionLoader: () => {
        return Promise.resolve({
          artworks_count: 1,
        })
      },
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      Object {
        "homePage": Object {
          "onboardingModule": Object {
            "showMyCollectionCard": true,
            "showSWACard": true,
          },
        },
      }
    `)
  })
})
