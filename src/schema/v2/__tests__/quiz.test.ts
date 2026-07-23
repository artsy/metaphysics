/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Quiz type", () => {
  const completeArtwork = {
    id: "andy-warhol-skull",
    _id: "artwork-1",
    title: "Skull",
  }

  // A saved-artwork (or related-artwork) record can outlive the artwork it
  // points to, e.g. when the underlying artwork is later deleted or
  // unlisted. Gravity then hands back a partial record that's missing `id`
  // (the slug) — this reproduces that shape.
  const partialArtwork = {
    _id: "artwork-2",
    is_saved: true,
  }

  const context = {
    meLoader: () => Promise.resolve({}),
    quizLoader: () =>
      Promise.resolve({
        id: "quiz-1",
        quiz_artworks: [
          { artwork_id: "artwork-1" },
          { artwork_id: "artwork-2" },
        ],
      }),
  }

  describe("savedArtworks", () => {
    it("filters out partial/malformed artwork nodes instead of throwing", () => {
      const savedArtworkLoader = jest.fn().mockImplementation((id) => {
        if (id === "artwork-1") {
          return Promise.resolve({ ...completeArtwork, is_saved: true })
        }
        return Promise.resolve(partialArtwork)
      })

      const query = `
        {
          me {
            quiz {
              savedArtworks {
                slug
                internalID
              }
            }
          }
        }
      `

      return runQuery(query, { ...context, savedArtworkLoader }).then(
        (data) => {
          expect(data.me.quiz.savedArtworks).toEqual([
            { slug: "andy-warhol-skull", internalID: "artwork-1" },
          ])
        }
      )
    })
  })

  describe("recommendedArtworks", () => {
    it("filters out partial/malformed related-artwork nodes instead of throwing", () => {
      const savedArtworkLoader = jest.fn().mockImplementation((id) => {
        if (id === "artwork-1") {
          return Promise.resolve({ ...completeArtwork, is_saved: true })
        }
        return Promise.resolve(partialArtwork)
      })

      const relatedLayerArtworksLoader = jest
        .fn()
        .mockResolvedValue([
          completeArtwork,
          { _id: "artwork-3" }, // missing `id` (slug)
        ])

      const query = `
        {
          me {
            quiz {
              recommendedArtworks {
                slug
                internalID
              }
            }
          }
        }
      `

      return runQuery(query, {
        ...context,
        savedArtworkLoader,
        relatedLayerArtworksLoader,
      }).then((data) => {
        expect(data.me.quiz.recommendedArtworks).toEqual([
          { slug: "andy-warhol-skull", internalID: "artwork-1" },
        ])
      })
    })
  })
})
