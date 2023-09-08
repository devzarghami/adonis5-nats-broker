/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/NatsTest' {
  export interface NatsTestResponseAssert {
    hasBody(): boolean
    headers(): object
    header(key: string): any
    body(): object
    status(): number
    assertStatus(expectedStatus: number): void
    assertBody(expectedBody: any): void
    assertBodyContains(expectedBody: any): void
    assertHeader(name: string, value?: any): void
  }
}
