import React, { useContext } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import jwt from 'jsonwebtoken'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Checkbox from '../../components/Checkbox'
import Button from '../../components/Button'
import { withAuthServerSideProps } from '../../utils/withAuth'
import { NotificationContext } from '../../components/Notifications'

const NewAnnouncement = ({ token, userRole }) => {
  if (userRole !== 'admin') {
    return <Text>You do not have permission to do that.</Text>
  }

  const { addNotification } = useContext(NotificationContext)

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
            pinned: !!form.get('pinned'),
            allowComments: !!form.get('allowComments'),
          }),
        }
      )

      if (createAnnouncementRes.status !== 200) {
        const reason = await createAnnouncementRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Announcement created successfully')

      const slug = await createAnnouncementRes.text()
      router.push(`/announcements/${slug}`)
    } catch (e) {
      addNotification('error', `Could not create announcement: ${e.message}`)
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
        <Checkbox label="Pin this announcement?" name="pinned" mb={4} />
        <Checkbox label="Allow comments?" name="allowComments" mb={4} />
        <Button display="block" ml="auto">
          Create announcement
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

export default NewAnnouncement
