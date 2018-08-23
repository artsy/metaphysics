/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"

describe("me { saved_artwork", () => {
  describe("Handles getting collection metadata", () => {
    xit("returns artworks for a collection", async () => {
      const artworksPath = resolve(
        "src",
        "test",
        "fixtures",
        "gravity",
        "artworks_array.json"
      )
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))

      const query = gql`
        {
          me {
            saved_artworks {
              description
              artworks_connection(first: 10) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      `
      const rootValue = {
        collectionLoader: sinon.stub().returns(
          Promise.resolve({
            name: "collection",
            private: false,
            default: true,
            description: "My beautiful collection",
          })
        ),
        collectionArtworksLoader: sinon.stub().returns(
          Promise.resolve({
            body: artworks,
            headers: { "x-total-count": 10 },
          })
        ),
      }

      return runAuthenticatedQuery(query, rootValue).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
