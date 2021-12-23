import React, { useState } from 'react'
import getConfig from 'next/config'
import jwt from 'jsonwebtoken'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'

const FinalisePasswordReset = ({ token, email, tokenError }) => {
  const [error, setError] = useState()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleInitiate = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const res = await fetch(`${SQ_API_URL}/reset-password/finalise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: form.get('newPassword'),
          email,
          token,
        }),
      })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <SEO title="Reset password" />
      <Text as="h1" mb={5}>
        Reset password
      </Text>
      <p>{email}</p>
      {!tokenError ? (
        <form onSubmit={handleInitiate}>
          <Input
            name="newPassword"
            type="password"
            label="New password"
            mb={4}
            required
          />
          <Button>Reset password</Button>
        </form>
      ) : (
        <p>Token error: {tokenError}</p>
      )}
    </>
  )
}

export const getServerSideProps = async ({ query: { token } }) => {
  const {
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()
  if (!token) return { props: { tokenError: 'Token not provided' } }
  try {
    const decoded = await jwt.verify(token, SQ_JWT_SECRET)
    if (decoded.validUntil < Date.now()) {
      return { props: { email: decoded.user, tokenError: 'Token has expired' } }
    }
    return { props: { token, email: decoded.user } }
  } catch (e) {
    return { props: { tokenError: e.message } }
  }
}

export default FinalisePasswordReset
