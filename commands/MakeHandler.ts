/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class MakeController extends BaseCommand {
  public static commandName = 'init:nats:handler'
  public static description = 'Make Nats exception handler'

  /**
   * Run command
   */
  public async run(): Promise<void> {
    const stub = join(__dirname, '..', 'templates', 'handler.txt')
    const name = 'Handler'
    this.generator
      .addFile(name, {
        suffix: '',
        pattern: 'pascalcase',
        form: 'singular',
      })
      .stub(stub)
      .destinationDir('app/Exceptions/Nats')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)
      .apply({ model: name })

    await this.generator.run()
  }
}
