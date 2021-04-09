import { fetchExchange } from 'urql'
import env from './environment'
import { mockFetchExchange } from './mock/exchanges'

// Default exchanges
const DEFAULT_FETCH_EXCHANGE = fetchExchange

export function getFetchExchange() {
  return env('MOCK_DATA') ? mockFetchExchange : DEFAULT_FETCH_EXCHANGE
}
