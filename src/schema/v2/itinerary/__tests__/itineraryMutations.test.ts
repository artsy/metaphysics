import { runAuthenticatedQuery } from "schema/v2/test/utils"

// These mutations are deliberate stubs: each must throw rather than
// return null or a fabricated success.

const mutations: {
  name: string
  input: string
  successFragment: string
}[] = [
  {
    name: "createItinerary",
    input: `citySlug: "new-york", title: "A day in Chelsea"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
  {
    name: "updateItinerary",
    input: `id: "itinerary-id", title: "Updated title"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
  {
    name: "deleteItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
  {
    name: "publishItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
  {
    name: "unpublishItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
  {
    name: "copyItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { title } }",
  },
]

describe("Itinerary mutations (stubs)", () => {
  mutations.forEach(({ name, input, successFragment }) => {
    it(`${name} throws a not-implemented error`, async () => {
      const mutation = `
        mutation {
          ${name}(input: { ${input} }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `

      await expect(runAuthenticatedQuery(mutation, {})).rejects.toThrow(
        `${name} is not implemented yet`
      )
    })
  })

  it("exposes every itinerary mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    mutations.forEach(({ name }) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
