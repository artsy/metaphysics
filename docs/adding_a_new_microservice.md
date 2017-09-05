## Adding a new Microservice to Metaphysics

Let's pretend we're mapping an API called `Three Body` which uses Gravity to generate a short-term JWT for your application.

1. Add your ENV Vars:

    ```sh
    THREE_BODY_APP_ID="xxx_id_xxx"
    THREE_BODY_API_BASE="https://threebody-staging.artsy.net/api"
    ```

    These will need to be added to : Your `.env`, the `.env.test` and the metaphysics Heroku instances,.

1. Create an API: `lib/apis/threeBody.js`
    
    This is function which is used for any API call to your service. Depending on what you want to map, it should probably look like this if you have mutations:

    ```js
    import { assign } from "lodash"
    import fetch from "./fetch"

    const { THREE_BODY_API_BASE } = process.env

    export default (path, accessToken, fetchOptions = {}) => {
      const headers = {}
      if (accessToken) assign(headers, { Authorization: `Bearer ${accessToken}` })
      return fetch(`${THREE_BODY_API_BASE}/${path}`, assign({}, fetchOptions, { headers }))
    }
    ```

      Or this if you're only reading:
    
    ```js
    import fetch from "./fetch"
    const { THREE_BODY_API_BASE } = process.env

    export default path => fetch(`${THREE_BODY_API_BASE}/${path}`)
    ```

1. Create an API loader factory: `lib/loaders/index.js`

    This links the API calls to a loader, which ensures that all API requests to the same service are cached correctly. It should look something like:

    ```diff
    import positron from "lib/apis/positron"
    + import threeBody from "lib/apis/threeBody"

    ...

    + export const threeBodyLoaderWithAuthenticationFactory = apiLoaderWithAuthenticationFactory(threeBody)
    ```

1. Create a loader for your service: `lib/loaders/loaders_with_authentication/threeBody.js`

    Roughly, this looks something like:

    ```js
    import { gravityLoaderWithAuthenticationFactory, threeBodyLoaderWithAuthenticationFactory } from "../api"

    const { THREE_BODY_APP_ID } = process.env

    export default accessToken => {
      let threeBodyTokenLoader
      const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
      const threeBodyAccessTokenLoader = () => threeBodyTokenLoader().then(data => data.token)

      const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)
      const threeBodyLoader = threeBodyLoaderWithAuthenticationFactory(threeBodyAccessTokenLoader)

      // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
      threeBodyTokenLoader = gravityLoader("me/token", { client_application_id: THREE_BODY_APP_ID }, { method: "POST" })

      return {
        artistAuctionsResultsLoader: threeBodyLoader(id => `/group/${id}`),
      }
    }
    ```

    Each of which corresponds to one API call: `[THREE_BODY_API_BASE]/group/[id]`. You would add more API loaders at the to the `return`ed object as you add more routes to metaphysics.

1. Next you need to expose those loaders to the `rootValue` so you can access them in the resolvers, you can do that by editing `/lib/loaders/loaders_with_authentication/index.js` to add the following:

    ```diff
    import convectionLoaders from "./convection"
    + import threeBodyLoaders from "./threeBody"
    import impulseLoaders from "./impulse"

    ...convectionLoaders(accessToken),
    + ...threeBodyLoaders(accessToken),
    ...impulseLoaders(accessToken, userID),
    ```

From here you need to handle the usual work of adding mutations for writing data, and updating the schema for reading data. Good luck!

If you want to see a PR where this comes together, check out [#726](https://github.com/artsy/metaphysics/pull/726).
