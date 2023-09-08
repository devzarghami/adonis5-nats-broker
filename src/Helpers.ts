import { headers, StringCodec } from 'nats'
import { parse } from 'qs'

export function parseNatsHeaders(natsRequest) {
  return natsRequest.headers || headers()
}

export function parseNatsQs(natsRequest) {
  try {
    const data = StringCodec().decode(natsRequest.data)
    const parsedData = JSON.parse(data)
    if (parsedData && parsedData.qs) {
      if (typeof parsedData.qs === 'object') {
        return parsedData.qs
      }
      if (typeof parsedData.qs === 'string') {
        return parse(parsedData.qs)
      }
    }
    return {}
  } catch (e) {
    return {}
  }
}

export function parseNatsBody(natsRequest) {
  try {
    const data = StringCodec().decode(natsRequest.data)
    const parsedData = JSON.parse(data)
    if (parsedData && parsedData.body && typeof parsedData.body === 'object') {
      return parsedData.body
    }
    return {}
  } catch (e) {
    return {}
  }
}

export function parseNatsParams(natsRequest, pattern) {
  const patternKeys = pattern.split('.')
  const subjectKeys = natsRequest.subject.split('?')[0].split('.')
  const params = {}
  for (let item of patternKeys) {
    if (item.startsWith('{')) {
      const key = item.replace('{', '').replace('}', '')
      params[key] = subjectKeys[patternKeys.indexOf(item)]
    }
  }
  return params
}

export function createSubject(pattern: string) {
  return pattern
    .split('.')
    .map((item) => (item.startsWith('{') ? '*' : item))
    .join('.')
}
