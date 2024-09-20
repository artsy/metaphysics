describe("CommerceOptInMutation", () => {
  const mutation: gql`
    mutation {
      CommerceOptIn(
        input: { exactPrice: true, pickupAvailable: true }
      ) {
        showOrError(
          __typename
          ... on CommerceOptInSuccess {
            show {
              
            }
          }
        )
      }
    }
  `
})