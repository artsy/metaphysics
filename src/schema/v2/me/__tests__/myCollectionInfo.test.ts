import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("MyCollectionInfo", () => {
  it("returns the correct info", () => {
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
    const query = gql`
      query {
        me {
          myCollectionInfo {
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
    return runAuthenticatedQuery(query, {
      meMyCollectionInfoLoader: () => Promise.resolve(myCollectionInfo),
    }).then(({ me }) => {
      expect(me).toEqual({
        myCollectionInfo: {
          internalID: "747474",
          imageURL: "https://images-cloud.artsy.com/something.jpg",
          imageVersions: ["one_version", "two_version"],
          name: "My Collection",
          default: false,
          description: null,
          private: true,
          includesPurchasedArtworks: false,
        },
      })
      return null
    })
  })
})
