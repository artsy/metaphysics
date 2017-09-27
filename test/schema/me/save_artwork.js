import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("SaveArtworkMutation", () => {
  const gravity = sinon.stub()
  const SaveArtworkMutation = schema.__get__("SaveArtworkMutation")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    SaveArtworkMutation.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    SaveArtworkMutation.__ResetDependency__("gravity")
  })

  it("saves an artwork", () => {
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
