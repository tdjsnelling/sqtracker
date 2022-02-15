import React, { useContext } from 'react'
import getConfig from 'next/config'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { NotificationContext } from '../../components/Notifications'

const InitiatePasswordReset = () => {
  const { addNotification } = useContext(NotificationContext)

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

      if (res.status !== 200) {
        const reason = await res.text()
        throw new Error(reason)
      }

      addNotification(
        'success',
        'If an account with that email address exists, you will receive an email shortly'
      )

      const token = await res.text()
      console.log(token)
    } catch (e) {
      addNotification(
        'error',
        `Could not initiate password reset: ${e.message}`
      )
      console.error(e)
    }
  }

  return (
    <>
      <SEO title="Reset password" />
      <Text as="h1" mb={5}>
        Reset password
      </Text>
      <form onSubmit={handleInitiate}>
        <Input name="email" type="email" label="Email" mb={4} required />
        <Button>Reset password</Button>
      </form>
    </>
  )
}

export default InitiatePasswordReset
