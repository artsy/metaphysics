/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { removeReproductionsFromArtworks } from "../carousel"

describe("ArtistCarousel type", () => {
  let artist = null
  let rootValue = null

  beforeEach(() => {
    artist = {
      id: "foo-bar",
      name: "Foo Bar",
      birthday: null,
      artworks_count: null,
    }
    rootValue = {
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
    }
  })

  describe("with artworks, no shows", () => {
    beforeEach(() => {
      rootValue.relatedShowsLoader = sinon
        .stub()
        .withArgs(artist.id, {
          sort: "-end_at",
          displayable: true,
          solo_show: true,
          top_tier: true,
        })
        .returns(Promise.resolve({ body: [] }))

      rootValue.artistArtworksLoader = sinon
        .stub()
        .withArgs(artist.id, {
          size: 7,
          sort: "-iconicity",
          published: true,
        })
        .returns(
          Promise.resolve([
            {
              id: "foo-bar-artwork-1",
              images: [
                {
                  original_height: 2333,
                  original_width: 3500,
                  image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
                  image_versions: ["large"],
                  is_default: true,
                },
              ],
            },
          ])
        )
    })

    it("fetches an artist by ID", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            id
            carousel {
              images {
                href
                resized(width: 300) {
                  url
                  width
                  height
                }
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data.artist.carousel).toEqual({
          images: [
            {
              href: "/artwork/foo-bar-artwork-1",
              resized: {
                height: 199,
                width: 300,
                url:
                  "https://gemini.cloudfront.test?resize_to=fit&width=300&height=199&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg", // eslint-disable-line
              },
            },
          ],
        })
      })
    })
  })
})

it("filters artworks with an attribution class other than what we want", () => {
  const before = [
    {
      title: "No attribution class",
      attribution_class: undefined,
    },
    {
      title: "Wanted attribution class",
      attribution_class: "unique",
    },
    {
      title: "Skipped attribution class",
      attribution_class: "ephemera",
    },
  ]
  const filtered = removeReproductionsFromArtworks(before)

  expect(filtered).toHaveLength(2)
  expect(filtered).toMatchInlineSnapshot(`
Array [
  Object {
    "attribution_class": undefined,
    "title": "No attribution class",
  },
  Object {
    "attribution_class": "unique",
    "title": "Wanted attribution class",
  },
]
`)
})
