/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

describe("SaveArtworkMutation", () => {
  it("saves an artwork", () => {
    const mutation = gql`
      mutation {
        saveArtwork(input: { artwork_id: "damon-zucconi-slow-verb" }) {
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
      date: "2015",
      title: "Slow Verb",
      artists: [],
    }

    const expectedArtworkData = {
      artwork: {
        date: "2015",
        title: "Slow Verb",
      },
    }

    const saveArtworkLoader = () => Promise.resolve(mutationResponse)
    const artworkLoader = () => Promise.resolve(artwork)

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, {
      saveArtworkLoader,
      artworkLoader,
    }).then(({ saveArtwork }) => {
      expect(saveArtwork).toEqual(expectedArtworkData)
    })
  })

  it("removes an artwork", () => {
    const mutation = gql`
      mutation {
        saveArtwork(
          input: { artwork_id: "damon-zucconi-slow-verb", remove: true }
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
      date: "2015",
      title: "Slow Verb",
      artists: [],
    }

    const expectedArtworkData = {
      artwork: {
        date: "2015",
        title: "Slow Verb",
      },
    }

    const deleteArtworkLoader = () => Promise.resolve(mutationResponse)
    const artworkLoader = () => Promise.resolve(artwork)

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, {
      deleteArtworkLoader,
      artworkLoader,
    }).then(({ saveArtwork }) => {
      expect(saveArtwork).toEqual(expectedArtworkData)
    })
  })
})
