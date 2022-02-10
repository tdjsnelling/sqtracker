import React, { useState } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import jwt from 'jsonwebtoken'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pin } from '@styled-icons/boxicons-regular'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import MarkdownBody from '../../components/MarkdownBody'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'

const Announcement = ({ announcement, token, userRole }) => {
  const [pinned, setPinned] = useState(announcement.pinned)

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const router = useRouter()

  const handleDelete = async () => {
    try {
      const deleteRes = await fetch(
        `${SQ_API_URL}/announcements/${announcement.slug}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (deleteRes.ok) {
        router.push('/announcements')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePin = async () => {
    try {
      const pinRes = await fetch(
        `${SQ_API_URL}/announcements/pin/${announcement._id}/${
          pinned ? 'unpin' : 'pin'
        }`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (pinRes.ok) {
        setPinned((p) => !p)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <SEO title={`${announcement.title} | Announcements`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Text as="h1">{announcement.title}</Text>
          {pinned && (
            <Box color="grey" ml={3}>
              <Pin size={24} />
            </Box>
          )}
        </Box>
        {userRole === 'admin' && (
          <Box display="flex" alignItems="center">
            <Button onClick={handlePin} variant="secondary" mr={3}>
              {pinned ? 'Unpin' : 'Pin'}
            </Button>
            <Button onClick={handleDelete}>Delete</Button>
          </Box>
        )}
      </Box>
      <Text color="grey" mb={5}>
        Posted {moment(announcement.created).format('HH:mm Do MMM YYYY')} by{' '}
        <Link href={`/user/${announcement.createdBy.username}`} passHref>
          <a>{announcement.createdBy.username}</a>
        </Link>
      </Text>
      <MarkdownBody>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {announcement.body}
        </ReactMarkdown>
      </MarkdownBody>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { slug } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  const announcementRes = await fetch(`${SQ_API_URL}/announcements/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const announcement = await announcementRes.json()
  return { props: { announcement, token, userRole: role } }
}

export default withAuth(Announcement)
