import { Assert } from '@japa/assert'
export default class ResponseAssert {
  constructor(protected response, protected assert = new Assert()) {}

  public hasBody() {
    return !!this.response.body
  }

  public headers() {
    return this.response.headers
  }

  public header(key) {
    return this.response.headers[key]
  }

  public body() {
    return this.response.body
  }

  public status() {
    return Number(this.response.headers.status)
  }

  public assertStatus(expectedStatus: number) {
    this.assert.equal(this.status(), expectedStatus)
  }

  public assertBody(expectedBody: any) {
    this.assert.deepEqual(this.body(), expectedBody)
  }

  public assertBodyContains(expectedBody: any) {
    this.assert.containsSubset(this.body(), expectedBody)
  }

  public assertHeader(name: string, value?: any) {
    this.assert.property(this.headers(), name)
    if (value !== undefined) {
      this.assert.deepEqual(this.header(name), value)
    }
  }
}
