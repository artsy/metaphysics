import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("SaveArtwork", () => {
  const gravity = sinon.stub()
  const SaveArtwork = schema.__get__("SaveArtwork")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    SaveArtwork.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    SaveArtwork.__ResetDependency__("gravity")
  })

  it("saves an artwork", () => {
    /* eslint-disable max-len */
    const mutation = `
      mutation {
        saveArtwork(input: { artwork_id: "damon-zucconi-slow-verb" }) {
          artwork {
            date
            title
          }
        }
      }
    `
    /* eslint-enable max-len */

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

    gravity.returns(Promise.resolve(artwork))

    return runAuthenticatedQuery(mutation).then(({ saveArtwork }) => {
      expect(saveArtwork).toEqual(expectedArtworkData)
    })
  })
})
