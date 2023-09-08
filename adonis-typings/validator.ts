/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { TypedSchema, ParsedTypedSchema } from '@ioc:Adonis/Core/Validator'
declare module '@ioc:Adonis/Addons/NatsRequest' {
  interface NatsRequestContract {
    /**
     * Validate current request. The data is optional here, since request
     * can pre-fill it for us
     */
    validate<T extends ParsedTypedSchema<TypedSchema>>(
      validator: Function | Object
    ): Promise<T['props']>
  }
}
