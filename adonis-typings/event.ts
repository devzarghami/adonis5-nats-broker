declare module '@ioc:Adonis/Core/Event' {
  import { NatsConnection } from 'nats'
  interface EventsList {
    'nats:connect': {
      connection: NatsConnection | Error
    }
    'nats:disconnect': {
      connection: NatsConnection
    }
    'nats:closed': {
      error: any
      connection: NatsConnection
    }
    'nats:error': {
      error: any
      connection: NatsConnection | Error
    }
  }
}
