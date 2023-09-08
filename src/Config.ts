import { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

const config: ConfigContract = {
  runModes: ['test.ts', 'server.js', 'server.ts'],
  ignoreMiddlewares: ['BodyParserMiddleware'],
  connection: {
    debug: false,
    name: 'adonis5-nats-broker',
    servers: 'nats://localhost:4222',
    maxReconnectAttempts: 10,
    pingInterval: 5000,
    reconnect: true,
    reconnectTimeWait: 2000,
    timeout: 30000,
  },
  namespaces: {
    controllers: 'app/Controllers/Nats',
    middleware: 'app/Middleware/Nats',
    exceptions: 'app/Exceptions/Nats',
    exceptionHandler: 'app/Exceptions/Nats/Handler',
  },
  generateRequestId: true,
  routes: {
    options: {},
    prefix: '',
  },
  request: {
    timeout: 30000,
    prefix: '',
    headers: {},
    qs: {},
  },
  publish: {
    prefix: '',
    headers: {},
    qs: {},
  },
}
export default config
