After adding an operation (mutation or query) to exchange the corresponding operation has to be added to Metaphysics. Because most of the clients don't use exchange directly since exchange doesn't know anything about galleries, users or artworks and it only keeps the ID of those entities. MP pulls that data from gravity and adds that to the order object coming from exchange.

This is a temporary solution for now. Graphql has a mechanism called sticking that can infer all these from the schema and defined types. At this point stitching is not fully implemented so it needs to be done manually. If you know that stitching is enabled for exchange stop reading and delete this document immediately.

## How?

Follow this PR as a reference: https://github.com/artsy/metaphysics/pull/1375

1. Copy updated exchange schema which includes the new mutation here: src/data/exchange.graphql (from exchange/\_schema.graphql)

2. Add test in `src/schema/v1/__tests__/ecommerce` similar to [seller_accept_offer_mutation.test.ts](https://github.com/artsy/metaphysics/blob/master/src/schema/v1/__tests__/ecommerce/seller_accept_offer_mutation.test.ts)

   Some annotations:

   This mocks exchange to return `exchangeOrderJSON` (a sample order) when the mutation is called.

   ```ts
   const resolvers = {
     Mutation: {
       sellerAcceptOffer: () => ({
         orderOrError: { order: exchangeOrderJSON },
       }),
     },
   }

   rootValue = mockxchange(resolvers)
   ```

   This calls the mutation and verifies if the mutation return value matches `sampleOrder`

   ```ts
       return runQuery(mutation, rootValue).then(data => {
         expect(data!.ecommerceSellerAcceptOffer.orderOrError.order).toEqual(
           sampleOrder()
         )
       })
     })
   ```

   Note:
   There is a limitation with this pattern of testing: it completely mocks the call to exchange so if there is
   a problem with the last 3 lines of the mutation code where it actually calls the exchange mutation, the test
   passes but the actual mutation doesn't work.

3. Add the mutation file in `src/schema/v1/ecommerce/` similar to [seller_accept_offer_mutation.ts](https://github.com/artsy/metaphysics/blob/master/src/schema/v1/ecommerce/seller_accept_offer_mutation.ts)

   Define the input types of the mutation. If the mutation/query you are adding has input types
   similar to an already existing one, reuse that otherwise define new ones.

   ```ts
   inputFields: OfferMutationInputType.getFields()
   ```

   Output of the mutation. Most likely you don't need to change this:

   ```ts
   outputFields: {
     orderOrError: {
       type: OrderOrFailureUnionType,
     },
   },
   ```

   `offerId` needs to match the input field you have defined above
   `accessToken` and `exchangeSchema` are passed to the function to be used to authenticate the call and
   actually pass it to exchange.

   ```ts
   mutateAndGetPayload: (
       { offerId },
       context,
       { rootValue: { accessToken, exchangeSchema } }
   ```

   This is the actual mutation that is passed to exchange:

   ```ts
   const mutation = gql`
     mutation sellerAcceptOffer($offerId: ID!) {
       ecommerceSellerAcceptOffer(input: {
         offerId: $offerId,
       }) {
         orderOrError {
           __typename
           ... on EcommerceOrderWithMutationSuccess {
             order {
               ${SellerOrderFields}
             }
           }
           ... on EcommerceOrderWithMutationFailure {
             error {
               type
               code
               data
             }
           }
         }
       }
     }
   `
   ```

   `sellerAcceptOffer($offerId: ID!)` is just what the mutation is called here and is arbitrary (true? does the name matter?)
   `ecommerceSellerAcceptOffer` matches the name of the exchange mutation with `ecommerce` prefix. (defined in step 5)

   All the fields exchange need to return are defined here. The most common fields are defined [here](https://github.com/artsy/metaphysics/blob/9b8589b5d57708d68d4328d1b336dc25192a4a00/src/schema/v1/ecommerce/query_helpers.ts)
   to be reused. You most likely need the `SellerOrderFields` or `BuyerOrderFields` depending on what client (force vs volt)
   calls this mutation

   ```ts
   order {
     ${SellerOrderFields}
   }
   ```

   This is where the exchange mutation is actually being called and the result is returned back to the client.
   `ecommerceSellerAcceptOffer` should match the prefixed mutation name above.

   ```ts
   return graphql(exchangeSchema, mutation, null, context, {
     offerId,
   }).then(extractEcommerceResponse("ecommerceSellerAcceptOffer"))
   ```

4. Add/Update types in src/schema/v1/ecommerce/types/ if needed:

5. Add your mutation to src/schema/v1/schema.ts
