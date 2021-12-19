import React, { useState } from 'react'
import getConfig from 'next/config'
import { useCookies } from 'react-cookie'

const Register = () => {
  const [error, setError] = useState()
  const [, setCookie] = useCookies()

  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL, SQ_ALLOW_REGISTER },
  } = getConfig()

  const handleRegister = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const res = await fetch(`${SQ_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.get('email'),
          username: form.get('username'),
          password: form.get('password'),
          invite: form.get('invite'),
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

  if (SQ_ALLOW_REGISTER !== 'open' && SQ_ALLOW_REGISTER !== 'invite') {
    return (
      <>
        <h1>{SQ_SITE_NAME}</h1>
        <p>Registration is closed.</p>
      </>
    )
  }

  return (
    <>
      <h1>{SQ_SITE_NAME}</h1>
      <form onSubmit={handleRegister}>
        <input name="email" />
        <input name="username" />
        <input name="password" />
        {SQ_ALLOW_REGISTER === 'invite' && <input name="token" />}
        <button>Register</button>
      </form>
    </>
  )
}

export default Register
