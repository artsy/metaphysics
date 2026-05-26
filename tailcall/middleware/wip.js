// import xapp from "@artsy/xapp"

async function onRequest({ request }) {
  // request.headers['X-XAPP-TOKEN'] = xapp.token
  request.headers['X-XAPP-TOKEN'] = 'test' // GRAVITY_XAPP_TOKEN

  // not possible at the moment
  // if (isGrpc) {
  //   const accessToken = await requestNewAnonymousAccessToken()
  //   console.log('accessToken', accessToken)
  //   request.headers['x-authorization'] = 'Bearer ' + accessToken
  // }

  return { request }
}

// function onResponseBody(response) {
//   return response
//   // const artist = JSON.parse(response)
//   // return JSON.stringify({ ...artist, slug: artist.sortable_id })
// }

