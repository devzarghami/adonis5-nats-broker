/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/NatsExceptionHandler' {
  import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
  import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'
  export default abstract class NatsExceptionHandler {
    constructor(logger: LoggerContract)
    logger: LoggerContract
    ignoreCodes: string[]
    ignoreStatuses: number[]
    internalIgnoreCodes: string[]
    statusPages: { [key: string]: string }
    context(ctx: NatsContextContract): any
    shouldReport(error: any): boolean
    makeJSONResponse(error: any, ctx: NatsContextContract): Promise<void>
    report(error: any, ctx: NatsContextContract): void
    handle(error: any, ctx: NatsContextContract): Promise<any>
  }
}
