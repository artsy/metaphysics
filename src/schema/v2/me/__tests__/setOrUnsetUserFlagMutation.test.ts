import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SetOrUnsetUserFlagMutation", () => {
  const user = {
    profession: "dev",
    user_flags: {
      my_flag_key: "myValue",
    },
  }

  const loaders = (options: { withUnsetFlag?: boolean } = {}) => ({
    setUserFlagLoader: () =>
      Promise.resolve(
        options.withUnsetFlag ? { ...user, user_flags: {} } : user
      ),
    meLoader: () => Promise.resolve({}),
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

  it("sets flag", async () => {
    const myFlagKey = "myFlagKey"
    const data = await runAuthenticatedQuery(setFlagQuery, loaders())
    const {
      setOrUnsetUserFlag: {
        userFlagsOrError: { userFlags },
      },
    } = data

    expect(userFlags[myFlagKey]).not.toBe(undefined)
  })

  it("unsets flag", async () => {
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
    expect(userFlags[myFlagKey]).toBe(undefined)
  })
})
