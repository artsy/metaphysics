import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SetOrUnsetUserFlagMutation", () => {
  const completeProfileResult = {
    bio: "bio",
    icon: "icon",
    other_relevant_positions: "dev",
  }

  const user = {
    profession: "dev",
    user_flags: {
      my_flag_key: "myValue",
    },
  }

  const loaders = (
    options: { withCompleteProfile?: boolean; withUnsetFlag?: boolean } = {}
  ) => ({
    setUserFlagLoader: () =>
      Promise.resolve(
        options.withUnsetFlag ? { ...user, user_flags: {} } : user
      ),
    collectorProfileLoader: () =>
      Promise.resolve(options.withCompleteProfile ? completeProfileResult : {}),
  })

  const setFlagQuery = `
    mutation {
      setOrUnsetUserFlag(input: {
        key: "myFlagKey",
        value: "myValue",
      }) {
        userFlagsOrError {
          ... on SetOrUnsetUserFlagMutationSuccess {
            userFlags
          }
          ... on SetOrUnsetUserFlagMutationFailure {
            mutationError {
              error
            }
          }
        }
      }
    }
  `

  const unsetFlagQuery = `
    mutation {
      setOrUnsetUserFlag(input: {
        key: "myFlagKey",
        value: null,
      }) {
        userFlagsOrError {
          ... on SetOrUnsetUserFlagMutationSuccess {
            userFlags
          }
          ... on SetOrUnsetUserFlagMutationFailure {
            mutationError {
              error
            }
          }
        }
      }
    }
  `

  it("sets flag and reevaluates other automatically injected flags", async () => {
    const injectedFlag = "collectorProfileIncompleteAt"
    const myFlagKey = "myFlagKey"
    const data = await runAuthenticatedQuery(setFlagQuery, loaders())
    const {
      setOrUnsetUserFlag: {
        userFlagsOrError: { userFlags },
      },
    } = data

    expect(userFlags[injectedFlag]).not.toBe(undefined)
    expect(userFlags[myFlagKey]).not.toBe(undefined)
  })

  it("unsets flag and reevaluates other automatically injected flags", async () => {
    const injectedFlag = "collectorProfileIncompleteAt"
    const myFlagKey = "myFlagKey"
    const data = await runAuthenticatedQuery(
      unsetFlagQuery,
      loaders({ withUnsetFlag: true })
    )
    const {
      setOrUnsetUserFlag: {
        userFlagsOrError: { userFlags },
      },
    } = data

    expect(userFlags[injectedFlag]).not.toBe(undefined)
    expect(userFlags[myFlagKey]).toBe(undefined)
  })
})
