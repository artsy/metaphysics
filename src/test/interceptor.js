import interceptor from "express-interceptor"

export const mockInterceptor = (interceptorCallback, fakeInterceptorOptions) =>
  {return interceptor((req, res) => {return {
    ...interceptorCallback(req, res),
    ...fakeInterceptorOptions,
  }})}
