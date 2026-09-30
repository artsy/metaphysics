import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createArtnetArtworkBatch mutation", () => {
  const query = `
    mutation {
      createArtnetArtworkBatch(
        input: {
          partnerID: "some-gallery"
          operations: [
            { actionType: PUBLISH, artworkID: "artwork-1" }
            {
              actionType: EDIT
              artworkID: "artwork-2"
              payload: { published: true }
            }
          ]
        }
      ) {
        artnetArtworkBatchOrError {
          ... on CreateArtnetArtworkBatchSuccess {
            batchID
            taskIDs
          }
          ... on CreateArtnetArtworkBatchFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("returns the batch and task ids on success", async () => {
    const createArtnetArtworkBatchLoader = jest.fn().mockResolvedValue({
      batch_id: "batch-1",
      task_ids: ["task-1", "task-2"],
    })

    const context = { createArtnetArtworkBatchLoader }

    const data = await runAuthenticatedQuery(query, context)

    expect(createArtnetArtworkBatchLoader).toHaveBeenCalledWith({
      partner_id: "some-gallery",
      operations: [
        {
          action_type: "Publish",
          artwork_id: "artwork-1",
          payload: undefined,
        },
        {
          action_type: "Edit",
          artwork_id: "artwork-2",
          payload: { published: true },
        },
      ],
    })
    expect(data).toEqual({
      createArtnetArtworkBatch: {
        artnetArtworkBatchOrError: {
          batchID: "batch-1",
          taskIDs: ["task-1", "task-2"],
        },
      },
    })
  })

  describe("payload", () => {
    const mutationWithPayload = (payload: string, actionType = "EDIT") => `
      mutation {
        createArtnetArtworkBatch(
          input: {
            partnerID: "some-gallery"
            operations: [
              { actionType: ${actionType}, payload: ${payload} }
            ]
          }
        ) {
          artnetArtworkBatchOrError {
            ... on CreateArtnetArtworkBatchSuccess {
              batchID
            }
          }
        }
      }
    `

    const successfulLoader = () =>
      jest.fn().mockResolvedValue({ batch_id: "batch-1", task_ids: ["task-1"] })

    it("maps a Create payload to Gravity's snake_case keys", async () => {
      const createArtnetArtworkBatchLoader = successfulLoader()

      await runAuthenticatedQuery(
        mutationWithPayload(
          `{
            title: "Untitled"
            artistID: 501
            workYearFrom: 2020
            published: false
            priceCurrencyCode: "USD"
            priceFrom: 100.5
            priceTo: 200
          }`,
          "CREATE"
        ),
        { createArtnetArtworkBatchLoader }
      )

      expect(createArtnetArtworkBatchLoader).toHaveBeenCalledWith({
        partner_id: "some-gallery",
        operations: [
          {
            action_type: "Create",
            artwork_id: undefined,
            payload: {
              title: "Untitled",
              artist_id: 501,
              work_year_from: 2020,
              published: false,
              price_currency_code: "USD",
              price_from: 100.5,
              price_to: 200,
            },
          },
        ],
      })
    })

    it("omits fields that were not sent and keeps explicit nulls", async () => {
      const createArtnetArtworkBatchLoader = successfulLoader()

      await runAuthenticatedQuery(
        mutationWithPayload(`{ published: true, priceTo: null }`),
        { createArtnetArtworkBatchLoader }
      )

      const [{ operations }] = createArtnetArtworkBatchLoader.mock.calls[0]
      expect(operations[0].payload).toStrictEqual({
        published: true,
        price_to: null,
      })
    })

    it("rejects fields that are not part of the typed payload", async () => {
      const createArtnetArtworkBatchLoader = successfulLoader()

      await expect(
        runAuthenticatedQuery(
          mutationWithPayload(`{ provenance: "Private" }`),
          {
            createArtnetArtworkBatchLoader,
          }
        )
      ).rejects.toThrow(/provenance/)
      expect(createArtnetArtworkBatchLoader).not.toHaveBeenCalled()
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      createArtnetArtworkBatchLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/artnet_artwork_batch - {"type":"error","message":"A batch cannot contain more than 100 operations"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createArtnetArtworkBatch: {
        artnetArtworkBatchOrError: {
          mutationError: {
            type: "error",
            message: "A batch cannot contain more than 100 operations",
          },
        },
      },
    })
  })
})
