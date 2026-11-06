import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("submission (deprecated stub)", () => {
  // Shape of Eigen < 8.65's SellWithArtsyHomeQuery
  const query = gql`
    query SellWithArtsyHomeQuery(
      $includeSubmission: Boolean = false
      $submissionID: ID
    ) {
      submission(id: $submissionID) @include(if: $includeSubmission) {
        id
        ...Header_submission
      }
    }

    fragment Header_submission on ConsignmentSubmission {
      artist {
        id
        imageUrl
        name
      }
      title
    }
  `

  it("validates when the field is skipped", async () => {
    const data = await runQuery(query)
    expect(data).toEqual({})
  })

  it("returns null when the field is included", async () => {
    const data = await runQuery(query, undefined, {
      includeSubmission: true,
      submissionID: "123",
    })
    expect(data).toEqual({ submission: null })
  })
})
