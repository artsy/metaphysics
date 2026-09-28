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
