/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  IdentityVerificationGravityResponse,
  IdentityVerificationOverrideGravityResponse,
  IdentityVerificationScanReferenceGravityResponse,
} from "../identityVerification"

describe("IdentityVerification type", () => {
  it("returns the resolved identity verification", async () => {
    const gravityIdentityVerification: IdentityVerificationGravityResponse = {
      id: "123",
      state: "pending",
      invitation_expires_at:
        "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
      user_id: "user1",
      created_at: "",
      name: "",
      email: "",
      sale_id: null,
      initiator_id: null,
      order_id: "order-123",
    }

    const query = `
      {
        me {
          identityVerification(id: "123") {
            internalID
            state
            userID
            invitationExpiresAt
            saleID
            orderID
            initiatorID
          }
        }
      }
    `

    const { me } = await runAuthenticatedQuery(query, {
      identityVerificationLoader: () =>
        Promise.resolve(gravityIdentityVerification),
    })

    expect(me).toEqual({
      identityVerification: {
        internalID: "123",
        state: "pending",
        userID: "user1",
        invitationExpiresAt:
          "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
        orderID: "order-123",
        saleID: null,
        initiatorID: null,
      },
    })
  })

  it("returns filtered list of verifications", async () => {
    const gravityIdentityVerification: IdentityVerificationGravityResponse = {
      id: "123",
      state: "pending",
      invitation_expires_at:
        "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
      user_id: "user1",
      created_at: "",
      name: "",
      email: "",
      sale_id: null,
      initiator_id: "user-123",
      order_id: null,
    }

    const gravityScanReference: IdentityVerificationScanReferenceGravityResponse = {
      id: "123",
      result: "failed",
      jumio_id: "j1",
      extracted_first_name: "Joe",
      extracted_last_name: "Foo",
      finished_at: "",
      extracted_id_fail_reason: "",
      extracted_similarity_fail_reason: "",
      created_at: "",
    }

    const gravityOverride: IdentityVerificationOverrideGravityResponse = {
      id: "10",
      new_state: "passed",
      old_state: "failed",
      reason: "yolo",
      user_id: "user1",
      created_at: "",
    }

    const gravityUser = {
      email: "user1@foo.com",
    }

    const query = gql`
      {
        identityVerificationsConnection(userId: "user1", page: 1) {
          edges {
            node {
              state
              saleID
              initiatorID
              orderID
              scanReferences {
                result
              }
              overrides {
                newState
                creator {
                  email
                }
              }
            }
          }
        }
      }
    `

    const { identityVerificationsConnection } = await runAuthenticatedQuery(
      query,
      {
        identityVerificationsLoader: () =>
          Promise.resolve({
            body: [gravityIdentityVerification],
            headers: { "x-total-count": "1" },
          }),
        identityVerificationScanReferencesLoader: () =>
          Promise.resolve([gravityScanReference]),
        identityVerificationOverridesLoader: () =>
          Promise.resolve([gravityOverride]),
        userByIDLoader: () => Promise.resolve(gravityUser),
      }
    )

    expect(identityVerificationsConnection.edges[0].node).toEqual({
      state: "pending",
      scanReferences: [{ result: "failed" }],
      overrides: [{ newState: "passed", creator: { email: "user1@foo.com" } }],
      saleID: null,
      initiatorID: "user-123",
      orderID: null,
    })
  })

  it("returns individual verification without authentication", async () => {
    const gravityIdentityVerification: IdentityVerificationGravityResponse = {
      id: "123",
      state: "pending",
      invitation_expires_at:
        "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
      user_id: "user1",
      created_at: "",
      name: "",
      email: "",
      sale_id: "sale-123",
      initiator_id: null,
      order_id: null,
    }

    const query = gql`
      {
        identityVerification(id: "123") {
          state
          saleID
          initiatorID
          orderID
        }
      }
    `

    const { identityVerification } = await runQuery(query, {
      identityVerificationLoader: () =>
        Promise.resolve(gravityIdentityVerification),
    })

    expect(identityVerification).toEqual({
      state: "pending",
      saleID: "sale-123",
      initiatorID: null,
      orderID: null,
    })
  })
})
