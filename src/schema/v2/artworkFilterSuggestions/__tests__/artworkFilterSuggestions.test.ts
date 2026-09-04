import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

const query = gql`
  {
    artworkFilterSuggestions(
      query: "large brutalist sculpture under 5k, japanese"
    ) {
      keyword
      fellOpen
      filters {
        geneIDs
        sizes
        priceRange
        artistNationalities
        framed
      }
      dropped {
        field
        value
      }
    }
  }
`

describe("artworkFilterSuggestions", () => {
  const gravityResponse = {
    query: "large brutalist sculpture under 5k, japanese",
    keyword: "brutalist",
    filters: {
      gene_ids: ["gene-sculpture"],
      sizes: ["large"],
      price_range: "*-5000",
      artist_nationalities: ["Japanese"],
      framed: true,
    },
    dropped: [{ field: "medium", value: "Hologram" }],
    fell_open: false,
  }

  it("calls the loader with nl_query and maps the response to camelCase", async () => {
    const artworkFilterSuggestionsLoader = jest.fn(async () => gravityResponse)

    const data = await runAuthenticatedQuery(query, {
      artworkFilterSuggestionsLoader,
    })

    expect(artworkFilterSuggestionsLoader).toHaveBeenCalledWith({
      nl_query: "large brutalist sculpture under 5k, japanese",
    })
    expect(data.artworkFilterSuggestions).toEqual({
      keyword: "brutalist",
      fellOpen: false,
      filters: {
        geneIDs: ["gene-sculpture"],
        sizes: ["LARGE"],
        priceRange: "*-5000",
        artistNationalities: ["Japanese"],
        framed: true,
      },
      dropped: [{ field: "medium", value: "Hologram" }],
    })
  })

  it("throws when unauthenticated (no loader on context)", async () => {
    await expect(runQuery(query)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
