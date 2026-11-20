import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const query = gql`
  query {
    artwork(id: "my-collection-artwork") {
      activeResaleSubmission {
        internalID
        state
      }
    }
  }
`

const artwork = { _id: "artwork-id", id: "my-collection-artwork" }

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    artworkLoader: jest.fn(() => Promise.resolve(artwork)),
    meResaleSubmissionsLoader: jest.fn(() =>
      Promise.resolve({
        body: [{ id: "submission-1", state: "accepted" }],
        headers: {},
      })
    ),
  }
})

describe("Artwork.activeResaleSubmission", () => {
  it("asks Gravity for the active submission by artwork id", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.meResaleSubmissionsLoader).toHaveBeenCalledWith({
      active: true,
      submitted_artwork_ids: ["artwork-id"],
    })
  })

  it("returns the active submission", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response.artwork.activeResaleSubmission).toEqual({
      internalID: "submission-1",
      state: "ACCEPTED",
    })
  })

  it("returns null when there is no active submission", async () => {
    context.meResaleSubmissionsLoader = jest.fn(() =>
      Promise.resolve({ body: [], headers: {} })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.artwork.activeResaleSubmission).toBeNull()
  })

  it("returns null when signed out", async () => {
    const response = await runQuery(query, {
      artworkLoader: context.artworkLoader,
    })

    expect(response.artwork.activeResaleSubmission).toBeNull()
  })
})
