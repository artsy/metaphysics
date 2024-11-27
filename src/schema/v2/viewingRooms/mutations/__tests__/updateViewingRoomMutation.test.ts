import config from "config"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateViewingRoomMutation", () => {
  const mockUpdateViewingRoomLoader = jest.fn()

  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  describe("success", () => {
    const context = {
      updateViewingRoomLoader: mockUpdateViewingRoomLoader,
    }

    const viewingRoomData = {
      id: "viewing-room-id",
    }

    beforeEach(() => {
      mockUpdateViewingRoomLoader.mockResolvedValue(
        Promise.resolve(viewingRoomData)
      )
    })

    afterEach(() => {
      mockUpdateViewingRoomLoader.mockReset()
    })

    describe("when passing all possible attributes", () => {
      const mutation = gql`
        mutation {
          updateViewingRoom(
            input: {
              viewingRoomID: "viewing-room-id"
              image: { internalID: "image-id" }
              attributes: {
                body: "test body"
                endAt: "2092-05-23T00:00:00.000Z"
                introStatement: "intro statement"
                pullQuote: "pull quote"
                startAt: "1992-05-23T00:00:00.000Z"
                timeZone: "Etc/UTC"
                title: "test title"
              }
            }
          ) {
            viewingRoomOrErrors {
              __typename

              ... on ViewingRoom {
                __typename

                internalID
              }

              ... on Errors {
                errors {
                  message
                }
              }
            }
          }
        }
      `

      it("correctly calls the updateViewingRoomLoader", async () => {
        const result = await runAuthenticatedQuery(mutation, context)

        expect(mockUpdateViewingRoomLoader).toHaveBeenCalledWith(
          "viewing-room-id",
          {
            ar_image_id: "image-id",
            body: "test body",
            end_at: "2092-05-23T00:00:00.000Z",
            intro_statement: "intro statement",
            pull_quote: "pull quote",
            start_at: "1992-05-23T00:00:00.000Z",
            time_zone: "Etc/UTC",
            title: "test title",
          }
        )

        expect(result).toMatchInlineSnapshot(`
          {
            "updateViewingRoom": {
              "viewingRoomOrErrors": {
                "__typename": "ViewingRoom",
                "internalID": "viewing-room-id",
              },
            },
          }
        `)
      })
    })

    describe("with null and ommited values", () => {
      const mutation = gql`
        mutation {
          updateViewingRoom(
            input: {
              viewingRoomID: "viewing-room-id"
              image: { internalID: "image-id" }
              attributes: {
                body: null
                pullQuote: null
                endAt: "2092-05-23T00:00:00.000Z"
                startAt: "1992-05-23T00:00:00.000Z"
                timeZone: "Etc/UTC"
                title: "test title"
              }
            }
          ) {
            viewingRoomOrErrors {
              __typename

              ... on ViewingRoom {
                __typename

                internalID
              }

              ... on Errors {
                errors {
                  message
                }
              }
            }
          }
        }
      `

      it("correctly calls the updateViewingRoomLoader", async () => {
        const result = await runAuthenticatedQuery(mutation, context)

        expect(mockUpdateViewingRoomLoader).toHaveBeenCalledWith(
          "viewing-room-id",
          {
            ar_image_id: "image-id",
            body: null,
            pull_quote: null,
            end_at: "2092-05-23T00:00:00.000Z",
            start_at: "1992-05-23T00:00:00.000Z",
            time_zone: "Etc/UTC",
            title: "test title",
          }
        )

        expect(result).toMatchInlineSnapshot(`
          {
            "updateViewingRoom": {
              "viewingRoomOrErrors": {
                "__typename": "ViewingRoom",
                "internalID": "viewing-room-id",
              },
            },
          }
        `)
      })
    })
  })

  describe("when gravity returns an error", () => {
    const context = {
      updateViewingRoomLoader: mockUpdateViewingRoomLoader,
    }

    beforeEach(() => {
      mockUpdateViewingRoomLoader.mockRejectedValue({
        body: {
          message: "An error occurred",
        },
      })
    })

    afterEach(() => {
      mockUpdateViewingRoomLoader.mockReset()
    })

    const mutation = gql`
      mutation {
        updateViewingRoom(
          input: {
            viewingRoomID: "viewing-room-id"
            image: { internalID: "image-id" }
            attributes: {
              body: "test body"
              endAt: "2092-05-23T00:00:00.000Z"
              introStatement: "intro statement"
              pullQuote: "pull quote"
              startAt: "1992-05-23T00:00:00.000Z"
              timeZone: "Etc/UTC"
              title: "test title"
            }
          }
        ) {
          viewingRoomOrErrors {
            __typename

            ... on ViewingRoom {
              __typename

              internalID
            }

            ... on Errors {
              errors {
                message
              }
            }
          }
        }
      }
    `

    it("returns an error", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "updateViewingRoom": {
            "viewingRoomOrErrors": {
              "__typename": "Errors",
              "errors": [
                {
                  "message": "An error occurred",
                },
              ],
            },
          },
        }
      `)
    })
  })
})
