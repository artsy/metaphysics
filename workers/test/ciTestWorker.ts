/// <reference types="@cloudflare/workers-types" />

export default {
  async fetch(_request: Request, _env, _ctx: ExecutionContext) {
    return new Response("Hello World 6")
  },
}
