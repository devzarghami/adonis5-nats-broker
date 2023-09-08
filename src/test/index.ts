import ResponseAssert from './ResponseAssert'
import { NatsTestResponseAssert } from '@ioc:Adonis/Addons/NatsTest'

declare module '@japa/runner' {
  export interface TestContext {
    broker: {
      request(
        pattern: string,
        payload?: object,
        options?: { headers?: object; qs?: object }
      ): Promise<NatsTestResponseAssert>
    }
  }
}
export const natsClient = (Broker) => {
  //@ts-ignore
  return async function (config, runner, { TestContext }) {
    TestContext.getter(
      'broker',
      () => ({
        request: async (
          pattern: string,
          payload?: object,
          options?: object
        ): Promise<NatsTestResponseAssert> => {
          try {
            let response = await Broker.request(pattern, payload, options)
            return new ResponseAssert(response)
          } catch (e) {
            return new ResponseAssert(e)
          }
        },
      }),
      true
    )
  }
}
