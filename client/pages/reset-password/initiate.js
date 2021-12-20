import React, { useState } from 'react'
import getConfig from 'next/config'
import SEO from '../../components/SEO'

const InitiatePasswordReset = () => {
  const [error, setError] = useState()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleInitiate = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const res = await fetch(`${SQ_API_URL}/reset-password/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.get('email'),
        }),
      })

      const token = await res.text()
      console.log(token)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <SEO title="Reset password" />
      <h1>Reset password</h1>
      <form onSubmit={handleInitiate}>
        <input name="email" />
        <button>Reset password</button>
      </form>
    </>
  )
}

export default InitiatePasswordReset
