import { runQuery } from "schema/v2/test/utils"
import sinon from "sinon"

describe("ArtworkConsignmentSubmissionType", () => {
  const artwork = {
    id: "richard-prince-untitled-portrait",
  }

  const consignmentSubmissions = [
    {
      state: "draft",
      my_collection_artwork_id: "richard-prince-untitled-portrait",
    },
  ]

  let context = {}

  beforeEach(() => {
    context = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
      submissionsLoader: sinon
        .stub()
        .returns(Promise.resolve(consignmentSubmissions)),
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
      consignmentSubmissions[0].state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      consignmentSubmissions[0].state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      consignmentSubmissions[0].state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual("Sold")

      consignmentSubmissions[0].state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual("Sold")

      consignmentSubmissions[0].state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      consignmentSubmissions[0].state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      consignmentSubmissions[0].state = "withdrawn - post-launch"
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
      consignmentSubmissions[0].state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      consignmentSubmissions[0].state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      consignmentSubmissions[0].state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      consignmentSubmissions[0].state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      consignmentSubmissions[0].state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      consignmentSubmissions[0].state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      consignmentSubmissions[0].state = "withdrawn - post-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()
    })
  })

  describe("#isSold", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            isSold
          }
        }
      }
    `

    it("returns correct isSold", async () => {
      consignmentSubmissions[0].state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeTrue()

      consignmentSubmissions[0].state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeTrue()

      consignmentSubmissions[0].state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      consignmentSubmissions[0].state = "withdrawn - post-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()
    })
  })
})
