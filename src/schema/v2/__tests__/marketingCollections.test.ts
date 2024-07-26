import gql from "lib/gql"
import { runQuery } from "../test/utils"
import config from "config"

const marketingCollectionsData = [
  {
    id: "percys-z-collection-1",
    slug: "percys-z-collection-1",
    title: "Percy Z Collection",
  },
  {
    id: "fiby-z-collection-2",
    slug: "fiby-z-collection-2",
    title: "Fiby Z Collection 2",
  },
]

beforeAll(() => {
  config.USE_UNSTITCHED_MARKETING_COLLECTION_SCHEMA = true
})

afterAll(() => {
  config.USE_UNSTITCHED_MARKETING_COLLECTION_SCHEMA = false
})

describe("MarketingCollections", () => {
  it("returns a list of marketing collections", async () => {
    const query = gql`
      {
        marketingCollections {
          slug
          title
        }
      }
    `
    const context = {
      marketingCollectionsLoader: () =>
        Promise.resolve({ body: marketingCollectionsData }),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      marketingCollections: marketingCollectionsData.map(({ slug, title }) => ({
        slug,
        title,
      })),
    })
  })
  it("returns marketing collection", async () => {
    const query = gql`
      {
        marketingCollection(slug: "percys-z-collection-1") {
          internalID
          slug
          title
        }
      }
    `

    const payload = marketingCollectionsData[0]

    const context = {
      marketingCollectionLoader: () => Promise.resolve(payload),
    } as any

    const data = await runQuery(query, context)
    const { id, ...expected } = payload

    expect(data).toEqual({
      marketingCollection: { ...expected, internalID: payload.id },
    })
  })
})
