import type { NatsConnection } from 'nats'
import { connect, Empty, headers, StringCodec } from 'nats'
import { createSubject, parseNatsParams } from './Helpers'
import Config from '../src/Config'
import Response from './Response'
import Request from './Request'
import { join } from 'path'

import type { ConfigContract, NatsBrokerContract } from '@ioc:Adonis/Addons/NatsBroker'
import type { ResolvedMiddlewareHandler } from '@ioc:Adonis/Core/Middleware'
import type { NatsResponseContract } from '@ioc:Adonis/Addons/NatsResponse'
import type {
  NatsRequestContract,
  NatsRequestOptions,
  NatsRequestResponse,
} from '@ioc:Adonis/Addons/NatsRequest'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ServerContract } from '@ioc:Adonis/Core/Server'
import type { EmitterContract } from '@ioc:Adonis/Core/Event'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { RouteMiddlewareHandler } from '@ioc:Adonis/Core/Route'
import type { RouteHandler } from '@ioc:Adonis/Core/Route'

export default class Broker implements NatsBrokerContract {
  private app: ApplicationContract
  private event: EmitterContract
  private server: ServerContract
  private logger: LoggerContract
  private config: ConfigContract = Config
  private connection: NatsConnection
  private middlewares: ResolvedMiddlewareHandler[] = []
  private readonly routes: [string, ResolvedMiddlewareHandler[], RouteHandler][] = []

  /**
   * Connect to Server
   * */
  public async createConnection(): Promise<NatsConnection | Error> {
    try {
      if (this.connection) return this.connection
      this.connection = await connect(this.config.connection)
      this.logger.info(`[NATS] Connected to ${this.connection?.getServer()}`)
      this.event.emit('nats:connect', { connection: this.connection })
      this.connection.closed().then((e) => {
        this.logger.error(`[NATS] Closed Connection ${this.connection.getServer()} ${e}!`, e)
        this.event.emit('nats:closed', { connection: this.connection, error: e })
      })
      await this.initRoutes()
      return this.connection
    } catch (e) {
      this.logger.error(`[NATS] Cannot connect to ${this.connection?.getServer()}`)
      this.event.emit('nats:error', { connection: this.connection, error: e })
      return new Error(e)
    }
  }

  /**
   * Disconnect from Server
   * */
  public async closeConnection(): Promise<Error | Boolean> {
    try {
      if (this.connection) await this.connection.close()
      await this.event.emit('nats:disconnect', { connection: this.connection })
      return true
    } catch (e) {
      this.logger.error(`[NATS] Cannot safe close connection`)
      this.event.emit('nats:error', { connection: this.connection, error: e })
      return new Error(e)
    }
  }

  private async initRoutes() {
    const globalMiddlewares = this.server.middleware.get()
    for (let [pattern, middlewares, controller] of this.routes) {
      new Promise((resolve) => {
        const subject: string = createSubject(pattern)
        const subscription = this.connection.subscribe(subject, this.config.routes.options)
        resolve(subscription)
      }).then(async (subscription) => {
        const Controller = await this.importHandler(
          join(this.app.appRoot, this.config.namespaces.controllers),
          controller
        )
        const ExceptionHandler = await this.importHandler(
          join(this.app.appRoot, this.config.namespaces.exceptionHandler),
          'handle'
        )

        // @ts-ignore
        for await (const natsRequest of subscription) {
          const context = {
            config: this.config as ConfigContract,
            request: {} as NatsRequestContract,
            response: {} as NatsResponseContract,
            logger: this.logger as LoggerContract,
            params: parseNatsParams(natsRequest, pattern),
          }
          try {
            context.response = new Response(async (response) => {
              return natsRequest.respond(response.body, { headers: response.headers })
            })
            context.request = new Request(this.app, context, natsRequest, pattern)

            for await (const item of globalMiddlewares) {
              const { default: middleware } = await item['value']()
              if (!this.config.ignoreMiddlewares.includes(middleware.name)) {
                const instance = new middleware()
                await instance.handle(context, async () => true, item.args)
              }
            }

            for await (const item of middlewares) {
              const { default: middleware } = await item['value']()
              const instance = new middleware()
              await instance.handle(context, async () => true, item.args)
            }

            await Controller(context)
          } catch (e) {
            ExceptionHandler(e, context)
          }
        }
      })
      console.log(
        `[NATS]\x1b[37m LOG [\x1b[34m RouteExplorer \x1b[37m] Mapped [\x1b[32m ${pattern
          .split('.')
          .join('.')} \x1b[37m] ${
          middlewares.length
            ? `Middlewares: [${middlewares.map((item) => item['value'].name).join(', ')}]`
            : ''
        }`
      )
    }
  }

  private async importHandler(path: string, handler) {
    const file = handler.split('.').length === 2 ? handler.split('.')[0] : ''
    const action = handler.split('.').length === 2 ? handler.split('.')[1] : handler
    let fullPath = join(path, file)
    try {
      const { default: Handler } = await import(fullPath)
      const instance = new Handler()
      return instance[action].bind(instance)
    } catch (e) {
      this.logger.error(
        `[NATS] Cannot Load file at path: ${fullPath}. Please ensure the file exists.`
      )
      this.event.emit('nats:error', { connection: this.connection, error: e })
      throw new Error(e)
    }
  }

  /* set route middleware */
  public middleware(middleware?: RouteMiddlewareHandler | RouteMiddlewareHandler[]): this | Error {
    this.middlewares = []
    if (!middleware) return this
    for (let mid of Array.isArray(middleware) ? middleware : [middleware])
      if (typeof mid === 'function') {
        // @ts-ignore
        this.middlewares.push({ type: 'function', value: mid, args: [] })
      } else {
        const name = mid.split(':')[0]
        const named: ResolvedMiddlewareHandler | null = this.server.middleware.getNamed(name)
        if (named) {
          named.args = mid.split(':').length === 2 ? mid.split(':')[1].split('.') : []
          this.middlewares.push(named)
        } else return new Error(`[NATS] cannot find ${name} middleware`)
      }
    return this
  }

  /**
   * Route
   * */
  public route(pattern: string, handler: RouteHandler) {
    const mixedPattern = this.config.routes.prefix
      .split('.')
      .concat(pattern.split('.'))
      .filter((item) => item.length)
      .join('.')
    this.routes.push([mixedPattern, this.middlewares, handler])
    return this
  }

  /**
   * Request
   * */
  public async request(
    pattern: string,
    body: object | Uint8Array = Empty,
    options: NatsRequestOptions
  ): Promise<NatsRequestResponse> {
    const mixedPattern = this.config.request.prefix
      .split('.')
      .concat(pattern.split('.'))
      .filter((item) => item.length)
      .join('.')
    try {
      const { validator, schema } = this.app.container.use('Adonis/Core/Validator')
      const payload = await validator.validate({
        data: Object.assign({ body: body }, options),
        schema: schema.create({
          timeout: schema.number.optional(),
          qs: schema.object.optional().anyMembers(),
          body: schema.object().anyMembers(),
          headers: schema.object.optional().anyMembers(),
          servers: schema.string.optional(),
        }),
      })
      const Headers = headers()
      const mixedHeaders = Object.assign(this.config.request.headers, payload.headers)
      for (const field of Object.keys(mixedHeaders)) {
        Headers.append(
          field,
          typeof mixedHeaders[field] === 'object'
            ? JSON.stringify(mixedHeaders[field])
            : String(mixedHeaders[field])
        )
      }
      const Payload = JSON.stringify({
        body: payload.body || {},
        qs: Object.assign(this.config.request.qs, payload.qs),
      })

      const name = this.config.connection.name + '-request'
      const connection = await connect({
        servers: payload.servers || this.config.connection.servers,
        name: name,
      })
      const response = await connection.request(mixedPattern, StringCodec().encode(Payload), {
        // @ts-ignore
        timeout: payload.timeout || this.config.request.timeout,
        headers: Headers,
      })
      await connection.flush()
      await connection.close()
      let responseHeaders = {}
      // @ts-ignore
      response.headers.headers.forEach((value, key) => (responseHeaders[key] = value[0]))
      responseHeaders['status'] = Number(responseHeaders['status'])
      const decode = StringCodec().decode(response.data)
      const parsedData = typeof JSON.parse(decode) === 'object' ? JSON.parse(decode) : decode

      const finalResponse = {
        headers: responseHeaders,
        body: parsedData,
        request: {
          servers: this.config.connection.servers,
          timeout: payload.timeout || this.config.request.timeout,
          payload: JSON.parse(Payload),
          headers: mixedHeaders,
          name: name,
          url: mixedPattern,
        },
      }

      if (Number(responseHeaders['status']) >= 400) throw finalResponse
      return finalResponse
    } catch (e) {
      throw e
    }
  }

  /**
   * Publish
   * */
  public async publish(
    pattern: string,
    body: object | Uint8Array = Empty,
    options: NatsRequestOptions
  ): Promise<Boolean | Error> {
    const mixedPattern = this.config.publish.prefix
      .split('.')
      .concat(pattern.split('.'))
      .filter((item) => item.length)
      .join('.')
    try {
      const { validator, schema } = this.app.container.use('Adonis/Core/Validator')
      const payload = await validator.validate({
        data: Object.assign({ body: body }, options),
        schema: schema.create({
          timeout: schema.number.optional(),
          qs: schema.object.optional().anyMembers(),
          body: schema.object().anyMembers(),
          headers: schema.object.optional().anyMembers(),
          servers: schema.string.optional(),
        }),
      })
      const Headers = headers()
      // @ts-ignore
      const mixedHeaders = Object.assign(this.config.publish.headers, payload.headers)
      for (const field of Object.keys(mixedHeaders)) {
        Headers.append(
          field,
          typeof mixedHeaders[field] === 'object'
            ? JSON.stringify(mixedHeaders[field])
            : String(mixedHeaders[field])
        )
      }
      const Payload = JSON.stringify({
        body: payload.body || {},
        qs: Object.assign(this.config.publish.qs, payload.qs),
      })
      const connection = await connect({
        servers: this.config.connection.servers,
        name: this.config.connection.name + '-publish',
      })
      connection.publish(mixedPattern, StringCodec().encode(Payload), { headers: Headers })
      await connection.flush()
      await connection.close()
      return true
    } catch (e) {
      throw e
    }
  }
}
