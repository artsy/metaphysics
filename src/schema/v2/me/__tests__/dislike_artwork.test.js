/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("DislikeArtworkMutation", () => {
  it("adds a disliked artwork", () => {
    const mutation = gql`
      mutation {
        dislikeArtwork(
          input: { artworkID: "not-my-aesthetic-choice", remove: false }
        ) {
          artwork {
            date
            title
          }
        }
      }
    `

    const mutationResponse = {
      artwork_id: "hello",
    }

    const artwork = {
      date: "2022",
      title: "Not Cute",
      artists: [],
    }

    const expectedArtworkData = {
      artwork: {
        date: "2022",
        title: "Not Cute",
      },
    }

    const dislikeArtworkLoader = () => Promise.resolve(mutationResponse)
    const artworkLoader = () => Promise.resolve(artwork)

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, {
      dislikeArtworkLoader,
      artworkLoader,
      deleteDislikedArtworkLoader: jest.fn(),
    }).then(({ dislikeArtwork }) => {
      expect(dislikeArtwork).toEqual(expectedArtworkData)
    })
  })

  it("removes a disliked artwork", () => {
    const mutation = gql`
      mutation {
        dislikeArtwork(
          input: { artworkID: "not-my-aesthetic-choice", remove: true }
        ) {
          artwork {
            date
            title
          }
        }
      }
    `

    const mutationResponse = {
      artwork_id: "hello",
    }

    const artwork = {
      date: "2022",
      title: "Not Cute",
      artists: [],
    }

    const expectedArtworkData = {
      artwork: {
        date: "2022",
        title: "Not Cute",
      },
    }

    const deleteDislikedArtworkLoader = () => Promise.resolve(mutationResponse)
    const artworkLoader = () => Promise.resolve(artwork)

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, {
      deleteDislikedArtworkLoader,
      artworkLoader,
      dislikeArtworkLoader: jest.fn(),
    }).then(({ dislikeArtwork }) => {
      expect(dislikeArtwork).toEqual(expectedArtworkData)
    })
  })
})
