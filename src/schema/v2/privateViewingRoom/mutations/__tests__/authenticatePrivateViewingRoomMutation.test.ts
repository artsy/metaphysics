import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("AuthenticatePrivateViewingRoomMutation", () => {
  const mutation = gql`
    mutation {
      authenticatePrivateViewingRoom(
        input: { slug: "some-gallery-for-anna", password: "letmein" }
      ) {
        privateViewingRoomOrError {
          __typename
          ... on AuthenticatePrivateViewingRoomSuccess {
            privateViewingRoom {
              galleryName
              artworks {
                artworkID
              }
            }
          }
          ... on AuthenticatePrivateViewingRoomFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("returns the room contents on a correct password", async () => {
    const context = {
      // Gravity's authenticate endpoint reuses room_json as-is and never
      // includes a `password_required` key (unlike the plain GET) — omitted
      // here deliberately to match the real response shape. There's no
      // corresponding field to assert on either: PrivateViewingRoomContentsType
      // (this mutation's success payload) doesn't expose passwordRequired at
      // all, since reaching Success already means the password check passed.
      authenticatePrivateViewingRoomLoader: jest.fn().mockResolvedValue({
        gallery_name: "Isabel Croxatto Galeria",
        artworks: [{ artwork_id: "artwork-1" }],
      }),
    }

    const result = await runQuery(mutation, context)

    expect(
      context.authenticatePrivateViewingRoomLoader
    ).toHaveBeenCalledWith("some-gallery-for-anna", { password: "letmein" })

    expect(result).toEqual({
      authenticatePrivateViewingRoom: {
        privateViewingRoomOrError: {
          __typename: "AuthenticatePrivateViewingRoomSuccess",
          privateViewingRoom: {
            galleryName: "Isabel Croxatto Galeria",
            artworks: [{ artworkID: "artwork-1" }],
          },
        },
      },
    })
  })

  it("returns a mutation error on an incorrect password", async () => {
    const context = {
      authenticatePrivateViewingRoomLoader: jest
        .fn()
        .mockRejectedValue({ body: { error: "Incorrect Password" } }),
    }

    const result = await runQuery(mutation, context)

    expect(result).toEqual({
      authenticatePrivateViewingRoom: {
        privateViewingRoomOrError: {
          __typename: "AuthenticatePrivateViewingRoomFailure",
          mutationError: {
            message: "Incorrect Password",
          },
        },
      },
    })
  })

  it("throws when the rejection can't be parsed as a Gravity error", async () => {
    // formatGravityError returns null when the error has no `.body`, isn't an
    // HTTPError, and doesn't match its legacy " - "-delimited fallback — e.g.
    // a network failure or a plain JS error thrown before a response exists.
    const context = {
      authenticatePrivateViewingRoomLoader: jest
        .fn()
        .mockRejectedValue(new Error("socket hang up")),
    }

    await expect(runQuery(mutation, context)).rejects.toThrow("socket hang up")
  })
})
