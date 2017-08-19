import loadersWithAuthentication from "./loaders_with_authentication"
import loadersWithoutAuthentication from "./loaders_without_authentication"

export default accessToken => {
  const loaders = loadersWithoutAuthentication()
  if (accessToken) {
    return Object.assign({}, loaders, loadersWithAuthentication(accessToken))
  }
  return loaders
}
