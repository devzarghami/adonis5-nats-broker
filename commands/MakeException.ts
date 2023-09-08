/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class MakeController extends BaseCommand {
  public static commandName = 'make:nats:exception'
  public static description = 'Make a new Nats exception'

  /**
   * The name of the model file.
   */
  @args.string({ description: 'Name of the nats exception' })
  public name: string

  /**
   * Run command
   */
  public async run(): Promise<void> {
    const stub = join(__dirname, '..', 'templates', 'exception.txt')

    this.name = this.name.replace(/Nats$/g, '')
    this.name = this.name.replace(this.name.charAt(0), this.name.charAt(0).toUpperCase())

    this.generator
      .addFile(this.name, {
        suffix: 'Exception',
        pattern: 'pascalcase',
        form: 'singular',
      })
      .stub(stub)
      .destinationDir('app/Exceptions/Nats')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)
      .apply({ model: this.name })

    await this.generator.run()
  }
}
