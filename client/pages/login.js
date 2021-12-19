import React, { useState } from 'react'
import getConfig from 'next/config'
import { useCookies } from 'react-cookie'

const Login = () => {
  const [error, setError] = useState()
  const [, setCookie] = useCookies()

  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL },
  } = getConfig()

  const handleLogin = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const res = await fetch(`${SQ_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      })

      const { token, uid } = await res.json()

      const expires = new Date()
      expires.setTime(expires.getTime() + 60 * 60 * 24 * 14 * 1000) // 14 days
      setCookie('token', token, { path: '/', expires })
      setCookie('userId', uid, { path: '/', expires })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <h1>{SQ_SITE_NAME}</h1>
      <form onSubmit={handleLogin}>
        <input name="username" />
        <input name="password" />
        <button>Log in</button>
      </form>
    </>
  )
}

export default Login
