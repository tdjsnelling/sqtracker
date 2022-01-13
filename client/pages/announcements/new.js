import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import jwt from 'jsonwebtoken'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'

const NewAnnouncement = ({ token, userRole }) => {
  if (userRole !== 'admin') {
    return <Text>You do not have permission to do that.</Text>
  }

  const router = useRouter()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleCreate = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const createAnnouncementRes = await fetch(
        `${SQ_API_URL}/announcements/new`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.get('title'),
            body: form.get('body'),
          }),
        }
      )
      if (createAnnouncementRes.ok) {
        const slug = await createAnnouncementRes.text()
        router.push(`/announcements/${slug}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <SEO title="New announcement" />
      <Text as="h1" mb={5}>
        New announcement
      </Text>
      <form onSubmit={handleCreate}>
        <Input name="title" label="Title" mb={4} required />
        <Input
          name="body"
          label="Body"
          placeholder="Markdown supported"
          rows={10}
          mb={4}
          required
        />
        <Button>Create announcement</Button>
      </form>
    </>
  )
}

export const getServerSideProps = async ({ req }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  return { props: { token, userRole: role } }
}

export default withAuth(NewAnnouncement)
