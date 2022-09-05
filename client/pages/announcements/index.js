import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { withAuthServerSideProps } from '../../utils/withAuth'
import Button from '../../components/Button'
import List from '../../components/List'

const Announcements = ({ announcements, pinnedAnnouncements, userRole }) => {
  return (
    <>
      <SEO title="Announcements" />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1">Announcements</Text>
        {userRole === 'admin' && (
          <Link href="/announcements/new" passHref>
            <a>
              <Button>Create new</Button>
            </a>
          </Link>
        )}
      </Box>
      {!!pinnedAnnouncements.length && (
        <>
          <Box mb={5}>
            <Text as="h3" mb={4}>
              Pinned announcements
            </Text>
            <List
              data={pinnedAnnouncements.map((announcement) => ({
                ...announcement,
                href: `/announcements/${announcement.slug}`,
              }))}
              columns={[
                {
                  header: 'Title',
                  accessor: 'title',
                  cell: ({ value }) => <Text>{value}</Text>,
                  gridWidth: '1fr',
                },
                {
                  header: 'Posted by',
                  accessor: 'createdBy.username',
                  cell: ({ value }) => <Text>{value}</Text>,
                  gridWidth: '1fr',
                },
                {
                  header: 'Created',
                  accessor: 'created',
                  cell: ({ value }) => (
                    <Text>{moment(value).format('HH:mm Do MMM YYYY')}</Text>
                  ),
                  rightAlign: true,
                  gridWidth: '1fr',
                },
              ]}
            />
          </Box>
          <Text as="h3" mb={4}>
            Other announcements
          </Text>
        </>
      )}
      <List
        data={announcements.map((announcement) => ({
          ...announcement,
          href: `/announcements/${announcement.slug}`,
        }))}
        columns={[
          {
            header: 'Title',
            accessor: 'title',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            header: 'Posted by',
            accessor: 'createdBy.username',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            header: 'Created',
            accessor: 'created',
            cell: ({ value }) => (
              <Text>{moment(value).format('HH:mm Do MMM YYYY')}</Text>
            ),
            rightAlign: true,
            gridWidth: '1fr',
          },
        ]}
      />
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(async ({ token }) => {
  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  const announcementsRes = await fetch(`${SQ_API_URL}/announcements/page/0`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const announcements = await announcementsRes.json()

  const pinnedAnnouncementsRes = await fetch(
    `${SQ_API_URL}/announcements/pinned`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  const pinnedAnnouncements = await pinnedAnnouncementsRes.json()

  return {
    props: { announcements, pinnedAnnouncements, userRole: role || 'user' },
  }
})

export default Announcements
