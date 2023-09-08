import { NatsRequestContract } from '@ioc:Adonis/Addons/NatsRequest'
import { parseNatsBody, parseNatsHeaders, parseNatsParams, parseNatsQs } from './Helpers'

export default class Request implements NatsRequestContract {
  public ctx
  public requestHeaders
  public requestBody
  public routeParams
  public requestQs
  public routeKey

  constructor(protected app, ctx, natsRequest, pattern) {
    this.ctx = ctx
    this.requestHeaders = parseNatsHeaders(natsRequest)
    this.requestBody = parseNatsBody(natsRequest)
    this.routeParams = parseNatsParams(natsRequest, pattern)
    this.requestQs = parseNatsQs(natsRequest)
    this.routeKey = natsRequest.subject
  }

  public async validate(model) {
    try {
      const { validator } = this.app.container.use('Adonis/Core/Validator')

      let payload = {}
      if (typeof model === 'function') {
        // @ts-ignore
        const instance = new model(this.ctx)
        // @ts-ignore
        payload = await validator.validate({
          data: this.requestBody,
          ...instance,
        })
      } else if (typeof model === 'object') {
        // @ts-ignore
        payload = await validator.validate({ data: this.requestBody, ...model })
      }
      return payload
    } catch (e) {
      throw e
    }
  }

  /**
   * Returns the request id from the `x-request-id` header. The
   * header is untoched, if it already exists.
   */
  public id() {
    let requestId = this.header('x-request-id', '')
    if (!requestId && this.ctx.config.generateRequestId) {
      let S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
      requestId = S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
      this.requestHeaders.append('x-request-id', requestId)
    }
    return requestId
  }
  /**
   * Update the request body with new data object. The `all` property
   * will be re-computed by merging the query string and request
   * body.
   */
  updateBody(body) {
    this.requestBody = body
  }
  /**
   * Update the query string with the new data object. The `all` property
   * will be re-computed by merging the query and the request body.
   */
  updateQs(data) {
    this.requestQs = data
  }
  /**
   * Update route params
   */
  updateParams(data) {
    this.routeParams = data
  }
  /**
   * bind value to context
   */
  public set(key, value) {
    if (!this[key]) this[key] = value
    else return new Error('This name is among the reserved names')
  }

  /**
   * get bind value to context
   */
  public get(key) {
    return this[key]
  }

  /**
   * Returns route params
   */
  public params() {
    return this.routeParams
  }

  /**
   * Returns the query string object by reference
   */
  public qs() {
    return this.requestQs
  }

  /**
   * Returns reference to the request body
   */
  public body() {
    return this.requestBody
  }

  /**
   * Returns reference to the merged copy of request body
   * and query string
   */
  public all() {
    return { ...this.requestBody, ...this.requestQs, ...this.routeParams }
  }

  /**
   * Returns value for a given key from the request body or query string.
   * The `defaultValue` is used when original value is `undefined`.
   *
   * @example
   * ```js
   * request.input('username')
   *
   * // with default value
   * request.input('username', 'dev zarghami')
   * ```
   */
  public input(key, defaultValue) {
    const mergedData = { ...this.requestBody, ...this.requestQs }
    return typeof mergedData[key] !== 'undefined' ? mergedData[key] : defaultValue
  }

  /**
   * Returns value for a given key from route params
   *
   * @example
   * ```js
   * request.param('id')
   *
   * // with default value
   * request.param('id', 1)
   * ```
   */
  public param(key, defaultValue) {
    return typeof this.routeParams[key] !== 'undefined' ? this.routeParams[key] : defaultValue
  }

  /**
   * Returns a copy of headers as an object
   */
  public headers() {
    let data = {}
    this.requestHeaders.headers.forEach((value, key) => (data[key] = value[0]))
    return data
  }

  /**
   * Returns value for a given header key. The default value is
   * used when original value is `undefined`.
   */
  public header(key: string, defaultValue?: any) {
    return this.requestHeaders.headers.has(key) ? this.headers()[key] : defaultValue
  }
}
