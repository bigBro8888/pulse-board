import { FormEvent, useState } from 'react'
import { ACCESS_PASSWORD, AUTH_STORAGE_KEY } from './auth'

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === '1'
}

export function clearAuth(): void {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

type LoginProps = {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, '1')
      setError('')
      onSuccess()
      return
    }
    setError('密码错误，请重试')
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="logo-mark" aria-hidden="true" />
          <h1>轻量化项目管理</h1>
        </div>
        <p className="login-sub">请输入访问密码以继续</p>

        <label className="login-field">
          <span>密码</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="请输入密码"
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn primary login-submit">
          登录
        </button>
      </form>
    </div>
  )
}
