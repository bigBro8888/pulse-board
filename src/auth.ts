export const ACCESS_PASSWORD = 'tony1234'
export const AUTH_STORAGE_KEY = 'lpm-auth-v1'

export function getAuthHeader(): string {
  return `Bearer ${ACCESS_PASSWORD}`
}
