import { runAuthenticatedQuery } from "schema/v2/test/utils"

// These mutations are deliberate stubs: Gravity's itinerary endpoints are
// built but not deployed, so no loader can reach them yet. Each one
// exposes its full input/output shape but must throw rather than return
// null or a fabricated success, so a client can't build a flow around a
// mutation that silently does nothing. When one of these is implemented,
// its assertion here should be updated (not deleted), so a stub can't be
// left behind unnoticed.

const mutations: {
  name: string
  input: string
  successFragment: string
}[] = [
  {
    name: "createItinerary",
    input: `citySlug: "new-york", name: "A day in Chelsea"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "updateItinerary",
    input: `id: "itinerary-id", name: "Updated name"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "deleteItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "publishItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "unpublishItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "copyItinerary",
    input: `id: "itinerary-id"`,
    successFragment: "... on ItineraryMutationSuccess { itinerary { name } }",
  },
  {
    name: "createItinerarySection",
    input: `itineraryID: "itinerary-id", title: "Morning"`,
    successFragment:
      "... on ItinerarySectionMutationSuccess { itinerarySection { title } }",
  },
  {
    name: "updateItinerarySection",
    input: `id: "section-id", title: "Afternoon"`,
    successFragment:
      "... on ItinerarySectionMutationSuccess { itinerarySection { title } }",
  },
  {
    name: "deleteItinerarySection",
    input: `id: "section-id"`,
    successFragment:
      "... on ItinerarySectionMutationSuccess { itinerarySection { title } }",
  },
  {
    name: "createItineraryStop",
    input: `itinerarySectionID: "section-id", title: "Coffee"`,
    successFragment:
      "... on ItineraryStopMutationSuccess { itineraryStop { title } }",
  },
  {
    name: "updateItineraryStop",
    input: `id: "stop-id", title: "Coffee break"`,
    successFragment:
      "... on ItineraryStopMutationSuccess { itineraryStop { title } }",
  },
  {
    name: "deleteItineraryStop",
    input: `id: "stop-id"`,
    successFragment:
      "... on ItineraryStopMutationSuccess { itineraryStop { title } }",
  },
]

describe("Itinerary mutations (stubs, pending Gravity)", () => {
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
