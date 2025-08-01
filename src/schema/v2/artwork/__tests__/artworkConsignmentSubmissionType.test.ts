import { runQuery } from "schema/v2/test/utils"
import sinon from "sinon"

describe("ArtworkConsignmentSubmissionType", () => {
  const artwork = {
    id: "richard-prince-untitled-portrait",
    consignmentSubmission: {
      state: "draft",
      id: "someID",
      externalId: "someExternalID",
    },
  }

  let context = {}

  beforeEach(() => {
    context = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
    }
  })

  describe("deprecated consignmentSubmission field", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            internalID
            externalID
            isEditable
            displayText
            inProgress
            isSold
            state
            stateLabel
            stateHelpMessage
            actionLabel
            buttonLabel
            stateLabelColor
          }
        }
      }
    `
    it("returns null since submissions are deprecated", async () => {
      const data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission).toEqual(null)
    })
  })
})
