import { runAuthenticatedQuery } from "test/utils"

describe("MyCollectionInfo", () => {
  it("returns the correct info", async () => {
    const myCollectionInfo = {
      id: "747474",
      image_url: "https://images-cloud.artsy.com/something.jpg",
      image_versions: ["one_version", "two_version"],
      name: "My Collection",
      default: false,
      description: null,
      private: true,
      includes_purchased_artworks: false,
    }
    const query = `
      {
        me {
          myCollectionInfo {
            id,
            internalID
            imageURL
            imageVersions
            name
            default
            description
            private
            includesPurchasedArtworks
          }
        }
      }
    `
    const response = await runAuthenticatedQuery(query, {
      meMyCollectionInfoLoader: () => Promise.resolve(myCollectionInfo),
    })
    console.log("RESPONSE", response)
    expect(response.me).toEqual({
      myCollectionInfo: {
        isHighestBidder: true,
        mostRecentBid: { id: "0" },
        activeBid: { id: "0" },
      },
    })
  })
})
