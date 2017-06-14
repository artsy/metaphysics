let gravityData = null
jest.mock("../../lib/loaders/gravity.js", () => ({ with: () => () => Promise.resolve(gravityData) }))

import { resolve } from "path"
import { readFileSync } from "fs"

import { runAuthenticatedQuery } from "../utils"

describe("Collections", () => {
  describe("Handles getting collection metadata", () => {
    it("returns collection metadata", () => {
      gravityData = {
        id: "saved-artwork",
        name: "Saved Artwork",
        default: true,
        description: "",
        image_url: null,
        image_versions: null,
        private: false,
      }

      const query = `
        {
          collection(id: "saved-artwork") {
            name
            private
            default
          }
        }
      `
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })

    it("returns artworks for a collection", () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "artworks_array.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))
      gravityData = { body: artworks, headers: { "x-total-count": 10 } }

      const query = `
        {
          collection(id: "saved-artwork") {
            artworks_connection(first:10) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      `
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
