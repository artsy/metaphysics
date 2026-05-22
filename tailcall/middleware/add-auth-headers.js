const GRAVITY_XAPP_TOKEN = process.env.GRAVITY_XAPP_TOKEN

const config = {
  OIDC_ISSUER: 'https://login.artnet-dev.com',
  OIDC_CLIENT_ID: 'shared-client-new-stack',
  OIDC_CLIENT_SECRET: 'password'
}

async function onRequest({ request }) {
  request.headers['X-XAPP-TOKEN'] = GRAVITY_XAPP_TOKEN

  // not possible at the moment
  // if (isGrpc) {
  //   const accessToken = await requestNewAnonymousAccessToken()
  //   console.log('accessToken', accessToken)
  //   request.headers['x-authorization'] = 'Bearer ' + accessToken
  // }

  return { request }
}

function onResponseBody(response) {
  return response
  // const artist = JSON.parse(response)
  // return JSON.stringify({ ...artist, slug: artist.sortable_id })
}

async function requestNewAnonymousAccessToken() {
  // Note: we need to use OIDC_ISSUER rather than OIDC_ISSUER_INTERNAL_URI because the
  // SSO app checks the hostname, but that's fine because we have a rule set up in
  // kubernetes to route requests to login.artnet.com internally.
  const responseJson = await fetch(config.OIDC_ISSUER + '/connect/token', {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${config.OIDC_CLIENT_ID}&client_secret=${config.OIDC_CLIENT_SECRET}&grant_type=client_credentials`,
  })
  const response = await responseJson.json()

  const accessToken = response.access_token
  if (!accessToken) {
    throw new Error(
      'Failed to get access token: access_token property missing from response'
    )
  }

  return accessToken
}
