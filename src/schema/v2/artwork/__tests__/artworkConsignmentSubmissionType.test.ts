import { runQuery } from "schema/v2/test/utils"
import sinon from "sinon"

describe("ArtworkConsignmentSubmissionType", () => {
  const artwork = {
    id: "richard-prince-untitled-portrait",
    consignmentSubmission: {
      state: "draft",
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

  describe("#displayText", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            displayText
          }
        }
      }
    `

    it("returns correct displayText", async () => {
      artwork.consignmentSubmission.state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )
    })
  })

  describe("#inProgress", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            inProgress
          }
        }
      }
    `

    it("returns correct inProgress", async () => {
      artwork.consignmentSubmission.state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()
    })
  })
})
