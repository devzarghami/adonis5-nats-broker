import { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'

export default class NatsExceptionHandler {
  /**
   * An array of error codes that must not be reported
   */
  public ignoreCodes: string[] = []

  /**
   * An array of http statuses that must not be reported. The first
   * level of filtration is on the basis of statuses and then
   * the error codes.
   */
  public ignoreStatuses: number[] = [400, 422, 401]

  /**
   * An array of internal error codes to ignore
   * from the reporting list
   */
  public internalIgnoreCodes: string[] = ['E_ROUTE_NOT_FOUND']

  /**
   * Map of status pages to render, instead of making the
   * regular response
   */
  public statusPages: { [key: string]: string } = {}

  constructor(public logger: LoggerContract) {}
  /**
   * A custom context to send to the logger when reporting
   * errors.
   */
  public context(ctx: NatsContextContract): any {
    const requestId = ctx.request.id()
    return requestId ? { 'x-request-id': requestId } : {}
  }

  /**
   * Returns a boolean telling if a given error is supposed
   * to be logged or not
   */
  public shouldReport(error: any): boolean {
    /**
     * Do not report the error when it's status is mentioned inside
     * the `ignoreStatuses` array.
     */
    if (error.status && this.ignoreStatuses.indexOf(error.status) > -1) {
      return false
    }
    /**
     * Don't report when error has a code and it's in the ignore list.
     */
    return !(
      error.code && this.ignoreCodes.concat(this.internalIgnoreCodes).indexOf(error.code) > -1
    )
  }

  /**
   * Makes the JSON response, based upon the environment in
   * which the app is runing
   */
  public async makeJSONResponse(error: any, ctx: NatsContextContract) {
    if (process.env.NODE_ENV === 'development') {
      ctx.response.status(error.status).send({
        message: error.message,
        stack: error.stack,
        code: error.code,
      })
      return
    }

    ctx.response.status(error.status).send({ message: error.message })
  }

  /**
   * Report a given error
   */
  public report(error: any, ctx: NatsContextContract) {
    error.status = error.status || 500

    if (!this.shouldReport(error)) {
      return
    }

    if (typeof error.report === 'function') {
      error.report(error, ctx)
      return
    }

    /**
     * - Using `error` for `500 and above`
     * - `warn` for `400 and above`
     * - `info` for rest. This should not happen, but technically it's possible for someone
     *    to raise with 200
     */
    if (!error.status || error.status >= 500) {
      if (process.env.NODE_ENV !== 'test') {
        ctx.logger.error({ err: error, ...this.context(ctx) }, error.message)
      }
    } else if (error.status >= 400) {
      ctx.logger.warn(this.context(ctx), error.message)
    } else {
      ctx.logger.info(this.context(ctx), error.message)
    }
  }

  /**
   * Handle exception and make response
   */
  public async handle(error: any, ctx: NatsContextContract) {
    error.status = error.status || 500

    if (typeof error.handle === 'function') {
      return error.handle(error, ctx)
    }

    /**
     * Send stack in the response when in test environment and
     * there is a fatal error.
     */
    if (error.status >= 500 && error.stack && process.env.NODE_ENV === 'test') {
      return ctx.response.status(error.status).send(error.stack)
    }

    return this.makeJSONResponse(error, ctx)
  }
}

/**
 * Single getter to pull status pages after expanding the range expression
 */
Object.defineProperty(NatsExceptionHandler.prototype, 'expandedStatusPages', {
  get() {
    const value = Object.keys(this.statusPages).reduce((result: any, codeRange: string) => {
      const parts = codeRange.split('.')
      const min = Number(parts[0])
      const max = Number(parts[parts.length - 1])

      if (isNaN(min) || isNaN(max)) {
        return result
      }

      if (min === max) {
        result[codeRange] = this.statusPages[codeRange]
      }

      Array.apply(null, new Array(max - min + 1)).forEach((_: number, step: number) => {
        result[min + step] = this.statusPages[codeRange]
      })

      return result
    }, {})

    Object.defineProperty(this, 'expandedStatusPages', { value })
    return value
  },
})
