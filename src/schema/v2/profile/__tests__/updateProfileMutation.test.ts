import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("updateProfileMutation", () => {
  it("updates a profile", async () => {
    const context = {
      updateProfileLoader: jest.fn().mockResolvedValue({
        _id: "profile123",
        id: "profile123",
        bio: "New bio",
        full_bio: "Full biography text here",
      }),
    }

    const mutation = gql`
      mutation {
        updateProfile(
          input: {
            id: "profile123"
            handle: "new-handle"
            bio: "New bio"
            fullBio: "Full biography text here"
            website: "http://example.com"
            location: "New York"
            isPrivate: true
          }
        ) {
          profileOrError {
            ... on UpdateProfileSuccess {
              profile {
                id
                bio
                fullBio
              }
            }
            ... on UpdateProfileFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(mutation, context)
    expect(context.updateProfileLoader).toHaveBeenCalledWith("profile123", {
      handle: "new-handle",
      bio: "New bio",
      full_bio: "Full biography text here",
      website: "http://example.com",
      location: "New York",
      private: true,
    })

    // ID is returned as a base64-encoded value
    expect(typeof data.updateProfile.profileOrError.profile.id).toBe("string")
    expect(data.updateProfile.profileOrError.profile.bio).toBe("New bio")
    expect(data.updateProfile.profileOrError.profile.fullBio).toBe(
      "Full biography text here"
    )
  })

  it("returns an error if the mutation fails", async () => {
    const context = {
      updateProfileLoader: jest.fn().mockRejectedValue({
        statusCode: 400,
        body: {
          type: "param_error",
          message: "Handle already taken",
          detail: "The handle is already in use by another profile",
        },
        error: "Bad Request",
      }),
    }

    const mutation = gql`
      mutation {
        updateProfile(input: { id: "profile123", handle: "existing-handle" }) {
          profileOrError {
            ... on UpdateProfileSuccess {
              profile {
                id
              }
            }
            ... on UpdateProfileFailure {
              mutationError {
                message
                type
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data.updateProfile.profileOrError.mutationError.type).toBe(
      "param_error"
    )
    expect(data.updateProfile.profileOrError.mutationError.message).toBe(
      "Handle already taken"
    )
  })
})
