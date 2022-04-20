import factories from "../api"

export default (opts) => {
  const { greenhouseLoaderWithoutAuthenticationFactory } = factories(opts)
  const greenhouseLoader = greenhouseLoaderWithoutAuthenticationFactory

  return {
    jobsLoader: greenhouseLoader("jobs?content=true"),
    jobLoader: greenhouseLoader((id) => `jobs/${id}`),
    departmentsLoader: greenhouseLoader("departments"),
  }
}
