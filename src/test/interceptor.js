import interceptor from "express-interceptor"

export const stubInterceptor = (interceptorCallback, fakeInterceptorOptions) =>
  interceptor((req, res) => ({
    ...interceptorCallback(req, res),
    ...fakeInterceptorOptions,
  }))
