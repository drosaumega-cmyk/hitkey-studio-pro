export class WebSocketManager {
    constructor(state: DurableObjectState, env: Env) {
      this.state = state;
      this.env = env;
    }
  
    async fetch(request: Request) {
      return new Response("WebSocketManager active", { status: 200 });
    }
  }
  