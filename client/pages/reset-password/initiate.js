import React, { useState } from 'react'
import getConfig from 'next/config'

const InitiatePasswordReset = () => {
  const [error, setError] = useState()

  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL },
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
      <h1>{SQ_SITE_NAME}</h1>
      <form onSubmit={handleInitiate}>
        <input name="email" />
        <button>Reset password</button>
      </form>
    </>
  )
}

export default InitiatePasswordReset
