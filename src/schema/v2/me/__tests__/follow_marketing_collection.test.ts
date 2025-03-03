/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FollowMarketingCollection", () => {
  const followMarketingCollectionLoader = jest.fn(
    ({ marketing_collection_id }) =>
      Promise.resolve({
        marketing_collection: {
          id: marketing_collection_id,
          title: "Post-War",
        },
      })
  )

  const unfollowMarketingCollectionLoader = jest.fn((marketingCollectionID) =>
    Promise.resolve({
      marketing_collection: {
        id: marketingCollectionID,
        title: "Post-War",
      },
    })
  )

  const marketingCollectionLoader = () =>
    Promise.resolve({
      id: "post-war",
      title: "Post-War",
    })

  const context = {
    followMarketingCollectionLoader,
    unfollowMarketingCollectionLoader,
    marketingCollectionLoader,
  }

  const expectedResponse = {
    followMarketingCollection: {
      marketingCollection: {
        title: "Post-War",
      },
    },
  }

  // TODO: figure out why this test fails
  it.skip("follows a marketingCollection", async () => {
    const mutation = `
      mutation {
        followMarketingCollection(input: { marketingCollectionID: "post-war" }) {
          marketingCollection {
            title
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context).then

    expect(result).toEqual(expectedResponse)
    expect(followMarketingCollectionLoader).toHaveBeenCalledWith({
      marketing_collection_id: "post-war",
    })
  })

  it("unfollows a marketingCollection", async () => {
    const mutation = `
      mutation {
        followMarketingCollection(input: { marketingCollectionID: "post-war", unfollow: true }) {
          marketingCollection {
            title
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual(expectedResponse)
    expect(unfollowMarketingCollectionLoader).toHaveBeenCalledWith("post-war")
  })
})
