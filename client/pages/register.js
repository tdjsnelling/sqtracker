import React, { useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import jwt from 'jsonwebtoken'

const Register = ({ token: inviteToken, tokenError }) => {
  const [error, setError] = useState()
  const [, setCookie] = useCookies()

  const router = useRouter()

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
          invite: inviteToken,
        }),
      })

      const { token, uid } = await res.json()

      const expires = new Date()
      expires.setTime(expires.getTime() + 60 * 60 * 24 * 14 * 1000) // 14 days
      setCookie('token', token, { path: '/', expires })
      setCookie('userId', uid, { path: '/', expires })

      router.push('/')
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
      {!tokenError ? (
        <form onSubmit={handleRegister}>
          <input name="email" />
          <input name="username" />
          <input name="password" />
          <button>Register</button>
        </form>
      ) : (
        <p>Token error: {tokenError}</p>
      )}
    </>
  )
}

export const getServerSideProps = async ({ query: { token } }) => {
  const {
    serverRuntimeConfig: { SQ_JWT_SECRET, SQ_ALLOW_REGISTER },
  } = getConfig()
  if (SQ_ALLOW_REGISTER === 'open') return { props: {} }
  if (!token && SQ_ALLOW_REGISTER === 'invite')
    return { props: { tokenError: 'Invite token not provided' } }
  try {
    const decoded = await jwt.verify(token, SQ_JWT_SECRET)
    if (decoded.validUntil < Date.now())
      return { props: { tokenError: 'Invite has expired' } }
    return { props: { token } }
  } catch (e) {
    return { props: { tokenError: e.message } }
  }
}

export default Register
