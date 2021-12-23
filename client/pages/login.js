import React, { useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import SEO from '../components/SEO'
import Text from '../components/Text'
import Input from '../components/Input'
import Button from '../components/Button'

const Login = () => {
  const [error, setError] = useState()
  const [, setCookie] = useCookies()

  const router = useRouter()

  const {
    publicRuntimeConfig: { SQ_API_URL },
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

      const { token, uid, username } = await res.json()

      const expires = new Date()
      expires.setTime(expires.getTime() + 60 * 60 * 24 * 14 * 1000) // 14 days
      setCookie('token', token, { path: '/', expires })
      setCookie('userId', uid, { path: '/', expires })
      setCookie('username', username, { path: '/', expires })

      router.push('/')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <SEO title="Log in" />
      <Text as="h1" mb={5}>
        Log in
      </Text>
      <form onSubmit={handleLogin}>
        <Input name="username" label="Username" mb={4} required />
        <Input
          name="password"
          type="password"
          label="Password"
          mb={4}
          required
        />
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
