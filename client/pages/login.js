import React, { useContext, useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import SEO from '../components/SEO'
import Text from '../components/Text'
import Input from '../components/Input'
import Button from '../components/Button'
import { NotificationContext } from '../components/Notifications'
import LoadingContext from '../utils/LoadingContext'
import { usernamePattern } from './register'

const Login = () => {
  const [totpRequired, setTotpRequired] = useState(false)

  const [, setCookie] = useCookies()

  const { addNotification } = useContext(NotificationContext)
  const { setLoading } = useContext(LoadingContext)

  const router = useRouter()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
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
          totp: form.get('totp'),
        }),
      })

      if (res.status !== 200) {
        const reason = await res.text()
        if (reason === 'One-time code required') setTotpRequired(true)
        throw new Error(reason)
      }

      const { token, uid, username } = await res.json()

      const expires = new Date()
      expires.setTime(expires.getTime() + 60 * 60 * 24 * 14 * 1000) // 14 days
      setCookie('token', token, { path: '/', expires })
      setCookie('userId', uid, { path: '/', expires })
      setCookie('username', username, { path: '/', expires })

      addNotification('success', `Welcome back ${form.get('username')}!`)

      router.push('/')
    } catch (e) {
      addNotification('error', `Could not log in: ${e.message}`)
      console.error(e)
    }

    setLoading(false)
  }

  return (
    <>
      <SEO title="Log in" />
      <Text as="h1" mb={5}>
        Log in
      </Text>
      <form onSubmit={handleLogin}>
        <Input
          name="username"
          label="Username"
          pattern={usernamePattern}
          mb={4}
          required
        />
        <Input
          name="password"
          type="password"
          label="Password"
          mb={4}
          required
        />
        {totpRequired && (
          <Input name="totp" label="One-time code" mb={4} required />
        )}
        <Button>Log in</Button>
      </form>
      <Link href="/reset-password/initiate" passHref>
        <Text as="a" display="inline-block" mt={5}>
          Reset password
        </Text>
      </Link>
    </>
  )
}

export default Login
