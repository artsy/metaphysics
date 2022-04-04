import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("previewSavedSearch", () => {
  const query = gql`
    {
      previewSavedSearch(attributes: { acquireable: true }) {
        labels {
          field
          name
          displayValue
          value
        }
      }
    }
  `

  it("returns a previewed saved search", async () => {
    const { previewSavedSearch } = await runQuery(query)

    expect(previewSavedSearch.labels).toEqual([
      {
        field: "acquireable",
        name: "Ways to Buy",
        displayValue: "Buy Now",
        value: "true",
      },
    ])
  })

  it("returns a previewed saved search for sizes", async () => {
    const query = gql`
      {
        previewSavedSearch(attributes: { sizes: [SMALL, MEDIUM, LARGE] }) {
          labels {
            field
            name
            displayValue
            value
          }
        }
      }
    `
    const { previewSavedSearch } = await runQuery(query)

    expect(previewSavedSearch.labels).toEqual([
      {
        field: "sizes",
        name: "Size",
        displayValue: "Small (under 40cm)",
        value: "SMALL",
      },
      {
        field: "sizes",
        name: "Size",
        displayValue: "Medium (40 – 100cm)",
        value: "MEDIUM",
      },
      {
        field: "sizes",
        name: "Size",
        displayValue: "Large (over 100cm)",
        value: "LARGE",
      },
    ])
  })
})
