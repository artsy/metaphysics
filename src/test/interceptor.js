import interceptor from "express-interceptor"

export const mockInterceptor = (interceptorCallback, fakeInterceptorOptions) =>
  interceptor((req, res) => ({
    ...interceptorCallback(req, res),
    ...fakeInterceptorOptions,
  }))
