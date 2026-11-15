import { GraphQLEnumType } from "graphql"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
} from "../resaleSubmission"

const query = gql`
  query {
    resaleShippingPreferenceOptions {
      field
      prompt
      options {
        key
        label
        description
      }
    }
  }
`

const enumsByField: Record<string, GraphQLEnumType> = {
  COURIER_HANDOFF: ResaleSubmissionCourierHandoffEnum,
  PACKAGING: ResaleSubmissionPackagingEnum,
  PACKER: ResaleSubmissionPackerEnum,
}

describe("resaleShippingPreferenceOptions", () => {
  it("returns the three shipping questions in the order they are asked", async () => {
    const { resaleShippingPreferenceOptions } = await runQuery(query, {})

    expect(
      resaleShippingPreferenceOptions.map((question) => question.field)
    ).toEqual(["PACKAGING", "PACKER", "COURIER_HANDOFF"])
  })

  it("returns each question’s prompt, options, labels and descriptions", async () => {
    const { resaleShippingPreferenceOptions } = await runQuery(query, {})

    expect(resaleShippingPreferenceOptions).toEqual([
      {
        field: "PACKAGING",
        prompt: "How will this be packed?",
        options: [
          {
            key: "FRAMED",
            label: "Framed",
            description: "Sold and shipped framed.",
          },
          {
            key: "ROLLED",
            label: "Rolled",
            description: "Removed from the frame and shipped in a tube.",
          },
          {
            key: "NO_PREFERENCE",
            label: "Open to both",
            description: "Either option works for you.",
          },
        ],
      },
      {
        field: "PACKER",
        prompt: "Who will be packing the work?",
        options: [
          {
            key: "SELLER",
            label: "I’ll pack it",
            description: "You pack the work securely.",
          },
          {
            key: "COURIER",
            label: "Courier packs",
            description: "The courier packs the work for you.",
          },
          {
            key: "NO_PREFERENCE",
            label: "Open to both",
            description: "Either option works for you.",
          },
        ],
      },
      {
        field: "COURIER_HANDOFF",
        prompt: "How will the work get to its buyer?",
        options: [
          {
            key: "SELLER_DROPOFF",
            label: "I’ll drop off to courier",
            description: "Bring the packed work to a courier.",
          },
          {
            key: "COURIER_PICKUP",
            label: "Courier needs to collect",
            description: "A courier collects the artwork from your location.",
          },
          {
            key: "NO_PREFERENCE",
            label: "Open to both",
            description: "Either option works for you.",
          },
        ],
      },
    ])
  })

  it("offers exactly the values each ResaleSubmission enum accepts", async () => {
    const { resaleShippingPreferenceOptions } = await runQuery(query, {})

    for (const question of resaleShippingPreferenceOptions) {
      const offeredKeys = question.options.map((option) => option.key).sort()
      const enumNames = enumsByField[question.field]
        .getValues()
        .map((value) => value.name)
        .sort()

      expect(offeredKeys).toEqual(enumNames)
    }
  })

  it("is available when signed out", async () => {
    const response = await runQuery(query, {})

    expect(response.resaleShippingPreferenceOptions).toHaveLength(3)
  })
})
