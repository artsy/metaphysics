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

  describe("#internalID", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            internalID
            externalID
          }
        }
      }
    `
    it("returns IDs if present", async () => {
      const data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.internalID).toEqual("someID")
      expect(data.artwork.consignmentSubmission.externalID).toEqual(
        "someExternalID"
      )
    })
  })

  describe("#isEditable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            isEditable
          }
        }
      }
    `

    it("returns isEditable value", async () => {
      artwork.consignmentSubmission.state = "SUBMITTED"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isEditable).toEqual(false)

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isEditable).toEqual(true)
    })
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
        "Submission evaluated"
      )

      artwork.consignmentSubmission.state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      artwork.consignmentSubmission.state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
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

      artwork.consignmentSubmission.state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission in progress"
      )

      artwork.consignmentSubmission.state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual("Sold")

      artwork.consignmentSubmission.state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      artwork.consignmentSubmission.state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      artwork.consignmentSubmission.state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )

      artwork.consignmentSubmission.state = "withdrawn - post-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Submission evaluated"
      )
    })

    it("returns unrecognized", async () => {
      artwork.consignmentSubmission.state = "New state"
      const data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.displayText).toEqual(
        "Unrecognized"
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
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeTrue()

      artwork.consignmentSubmission.state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()

      artwork.consignmentSubmission.state = "withdrawn - post-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.inProgress).toBeFalse()
    })

    it("returns undefined if state unknown", async () => {
      artwork.consignmentSubmission.state = "New state"
      const data = await runQuery(query, context)
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
      artwork.consignmentSubmission.state = "submitted"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "approved"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "published"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "rejected"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "hold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "closed"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "open"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "sold"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeTrue()

      artwork.consignmentSubmission.state = "bought in"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "canceled"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "withdrawn - pre-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()

      artwork.consignmentSubmission.state = "withdrawn - post-launch"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()
    })

    it("returns undefined if state unknown", async () => {
      artwork.consignmentSubmission.state = "New state"
      const data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.isSold).toBeFalse()
    })
  })

  describe("#state", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          consignmentSubmission {
            state
          }
        }
      }
    `

    it("returns correct state", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.state).toEqual("DRAFT")

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.state).toEqual("APPROVED")
    })
  })

  describe("#stateLabel", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          consignmentSubmission {
            stateLabel
          }
        }
      }
    `

    it("returns correct state label", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(null)

      artwork.consignmentSubmission.state = "HOLD"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "In Progress"
      )

      artwork.consignmentSubmission.state = "CLOSED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "In Progress"
      )

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual("Approved")

      artwork.consignmentSubmission.state = "SUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "In Progress"
      )

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "In Progress"
      )

      artwork.consignmentSubmission.state = "RESUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "In Progress"
      )

      artwork.consignmentSubmission.state = "REJECTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabel).toEqual(
        "Submission Unsuccessful"
      )
    })
  })

  describe("#stateHelpMessage", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          consignmentSubmission {
            stateHelpMessage
          }
        }
      }
    `

    it("returns correct help message", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "You’ve started a submission to sell with Artsy but have not yet completed it."
      )

      artwork.consignmentSubmission.state = "SUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "Your submission is currently being reviewed by our team. You will receive a response within 3 to 5 days."
      )

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "Congratulations, your submission has been approved. Please provide additional information so we can list your work and match it with the best selling opportunity."
      )

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "Thank you for the information. Your submission is being assessed for sales opportunities. Our specialists will contact you via email or phone to coordinate the next steps."
      )

      artwork.consignmentSubmission.state = "RESUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "Thank you for the information. Your submission is being assessed for sales opportunities. Our specialists will contact you via email or phone to coordinate the next steps."
      )

      artwork.consignmentSubmission.state = "REJECTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "Our specialists have reviewed this submission and determined that we do not currently have a market for it."
      )

      artwork.consignmentSubmission.state = "HOLD"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "The artwork is currently being reviewed by our team."
      )

      artwork.consignmentSubmission.state = "CLOSED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateHelpMessage).toEqual(
        "The artwork is currently being reviewed by our team."
      )
    })
  })

  describe("#actionLabel", () => {
    const query = `
    {
      artwork(id: "richard-prince-untitled-portrait") {
        consignmentSubmission {
          actionLabel
        }
      }
    }
  `

    it("returns correct button lable", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(
        "Complete Submission"
      )

      artwork.consignmentSubmission.state = "SUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(
        "Complete your Listing"
      )

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)

      artwork.consignmentSubmission.state = "RESUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)

      artwork.consignmentSubmission.state = "REJECTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)

      artwork.consignmentSubmission.state = "HOLD"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)

      artwork.consignmentSubmission.state = "CLOSED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.actionLabel).toEqual(null)
    })
  })

  describe("#buttonLabel", () => {
    const query = `
    {
      artwork(id: "richard-prince-untitled-portrait") {
        consignmentSubmission {
          buttonLabel
        }
      }
    }
  `

    it("returns correct button lable", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(
        "Complete Submission"
      )

      artwork.consignmentSubmission.state = "SUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(
        "Edit Submission"
      )

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(
        "Complete your Listing"
      )

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(
        "Edit Submission"
      )

      artwork.consignmentSubmission.state = "RESUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(
        "Edit Submission"
      )

      artwork.consignmentSubmission.state = "REJECTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(null)

      artwork.consignmentSubmission.state = "HOLD"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(null)

      artwork.consignmentSubmission.state = "CLOSED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.buttonLabel).toEqual(null)
    })
  })

  describe("#stateLabelColor", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          consignmentSubmission {
            stateLabelColor
          }
        }
      }
    `

    it("returns correct state label", async () => {
      artwork.consignmentSubmission.state = "DRAFT"
      let data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "HOLD"
      data = await runQuery(query, context)

      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )
      artwork.consignmentSubmission.state = "CLOSED"

      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "APPROVED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "SUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "PUBLISHED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "RESUBMITTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black100"
      )

      artwork.consignmentSubmission.state = "REJECTED"
      data = await runQuery(query, context)
      expect(data.artwork.consignmentSubmission.stateLabelColor).toEqual(
        "black60"
      )
    })
  })
})
