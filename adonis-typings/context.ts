/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/NatsContext' {
  import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
  import type { NatsRequestContract } from '@ioc:Adonis/Addons/NatsRequest'
  import type { NatsResponseContract } from '@ioc:Adonis/Addons/NatsResponse'
  import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

  export interface NatsContextContract {
    /**
     * A helper to see top level properties on the context object
     */
    config: ConfigContract
    request: NatsRequestContract
    response: NatsResponseContract
    logger: LoggerContract
    params: Record<string, any>
    routeKey: string
  }

  /**
   * Shape of the constructor. We export the constructor and not
   * the context instance, since that is passed to the NATS
   * lifecycle
   */

  const NatsContext: NatsContextContract
  export default NatsContext
}
