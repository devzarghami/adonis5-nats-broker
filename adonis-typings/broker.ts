/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/NatsBroker' {
  import type { ConnectionOptions, NatsConnection, SubscriptionOptions } from 'nats'
  import type { RouteMiddlewareHandler, RouteHandler } from '@ioc:Adonis/Core/Route'
  import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest'
  export interface NatsBrokerContract {
    createConnection(): Promise<NatsConnection | Error>

    closeConnection(): Promise<Error | Boolean>

    middleware(middleware?: RouteMiddlewareHandler | RouteMiddlewareHandler[])

    route(pattern: string, handler: RouteHandler)

    request(pattern: string, body?: any, options?: NatsRequestOptions): Promise<NatsRequestResponse>

    publish(
      pattern: string,
      body?: object | Uint8Array,
      options?: NatsRequestOptions
    ): Promise<Error | Boolean>
  }

  export interface ConfigContract {
    runModes: string[]
    ignoreMiddlewares: string[]
    connection: ConnectionOptions
    namespaces: {
      controllers: string
      middleware: string
      exceptions: string
      exceptionHandler: string
    }
    generateRequestId: boolean
    routes: {
      options: SubscriptionOptions
      prefix: string
    }
    request: {
      timeout: number
      prefix: string
      headers: object
      qs: object
    }
    publish: {
      prefix: string
      headers: object
      qs: object
    }
  }

  const Broker: NatsBrokerContract
  export default Broker
}
