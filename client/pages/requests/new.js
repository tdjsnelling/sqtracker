import React, { useContext } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import jwt from 'jsonwebtoken'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { withAuthServerSideProps } from '../../utils/withAuth'
import { NotificationContext } from '../../components/Notifications'
import LoadingContext from '../../utils/LoadingContext'

const NewRequest = ({ token }) => {
  const { addNotification } = useContext(NotificationContext)
  const { setLoading } = useContext(LoadingContext)

  const router = useRouter()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.target)

    try {
      const createRequestRes = await fetch(`${SQ_API_URL}/requests/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.get('title'),
          body: form.get('body'),
        }),
      })

      if (createRequestRes.status !== 200) {
        const reason = await createRequestRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Request created successfully')

      const { index } = await createRequestRes.json()
      router.push(`/requests/${index}`)
    } catch (e) {
      addNotification('error', `Could not create request: ${e.message}`)
      console.error(e)
    }

    setLoading(false)
  }

  return (
    <>
      <SEO title="New request" />
      <Text as="h1" mb={5}>
        New request
      </Text>
      <form onSubmit={handleCreate}>
        <Input
          name="title"
          label="Title"
          placeholder="What are you looking for?"
          mb={4}
          required
        />
        <Input
          name="body"
          label="Description"
          placeholder="Markdown supported"
          rows={10}
          mb={4}
          required
        />
        <Button display="block" ml="auto">
          Create request
        </Button>
      </form>
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(async ({ token }) => {
  if (!token) return { props: {} }

  const {
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  return { props: { token, userRole: role } }
})

export default NewRequest
