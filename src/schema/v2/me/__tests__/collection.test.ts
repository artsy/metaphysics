import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const query = gql`
  query {
    me {
      collection(id: "123-abc") {
        internalID
        name
        default
        saves
        artworksCount
      }
    }
  }
`

const mockGravityCollection = {
  id: "123-abc",
  name: "Works for dining room",
  default: false,
  saves: true,
  artworks_count: 42,
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
    collectionLoader: jest.fn(() => Promise.resolve(mockGravityCollection)),
    authenticatedLoaders: {},
  }
})

it("passes correct args to Gravity", async () => {
  await runAuthenticatedQuery(query, context)

  expect(context.collectionLoader as jest.Mock).toHaveBeenCalledWith(
    mockGravityCollection.id,
    {
      user_id: "user-42",
      private: true,
    }
  )
})

it("returns collection attributes", async () => {
  const response = await runAuthenticatedQuery(query, context)

  expect(response).toEqual({
    me: {
      collection: {
        internalID: "123-abc",
        name: "Works for dining room",
        default: false,
        saves: true,
        artworksCount: 42,
      },
    },
  })
})
