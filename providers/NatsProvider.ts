import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { NatsBrokerContract } from '@ioc:Adonis/Addons/NatsBroker'
import Broker from '../src/Broker'
import { natsClient } from '../src/test'
import ExceptionHandler from '../src/ExceptionHandler'

export default class NatsProvider {
  public static needsApplication = true
  private connect: Boolean
  private readonly broker: NatsBrokerContract

  constructor(protected app: ApplicationContract) {
    this.connect = false
    this.broker = new Broker()
  }

  public register() {
    this.app.container.singleton('Adonis/Addons/NatsBroker', () => this.broker)
    this.app.container.singleton('Adonis/Addons/NatsExceptionHandler', () => ExceptionHandler)
    this.app.container.singleton('Adonis/Addons/NatsTest', () => ({ natsClient }))
  }

  public async boot() {
    this.broker['app'] = this.app
    this.broker['event'] = this.app.container.use('Adonis/Core/Event')
    this.broker['logger'] = this.app.container.use('Adonis/Core/Logger')
    this.broker['server'] = this.app.container.use('Adonis/Core/Server')
    this.broker['config'] = Object.assign(
      this.broker['config'],
      this.app.container.use('Adonis/Core/Config').get('nats')
    )

    this.connect =
      process.argv.length >= 2
        ? this.broker['config'].runModes
            .map((item) => process.argv[1].endsWith(item))
            .includes(true)
        : false
  }

  public async ready() {
    if (this.broker && this.connect) await this.broker.createConnection()
  }

  public async shutdown() {
    if (this.broker && this.broker['connection']) await this.broker.closeConnection()
  }
}
