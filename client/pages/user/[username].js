import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import jwt from 'jsonwebtoken'
import { BarChartSquare } from '@styled-icons/boxicons-regular/BarChartSquare'
import { Upload } from '@styled-icons/boxicons-regular/Upload'
import { Download } from '@styled-icons/boxicons-regular/Download'
import { UserCircle } from '@styled-icons/boxicons-regular/UserCircle'
import getReqCookies from '../../utils/getReqCookies'
import withAuth from '../../utils/withAuth'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import Infobox from '../../components/Infobox'
import TorrentList from '../../components/TorrentList'
import Comment from '../../components/Comment'

const User = ({ user, userRole }) => {
  const [cookies] = useCookies()

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  const downloadedBytes = prettyBytes(user.downloaded?.bytes || 0).split(' ')
  const uploadedBytes = prettyBytes(user.uploaded?.bytes || 0).split(' ')

  console.log(user)
  return (
    <>
      <SEO title={`${user.username}’s profile`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Text as="h1">{user.username}’s profile</Text>
          {user.role === 'admin' && (
            <Text icon={UserCircle} iconColor="primary" ml={3}>
              Admin
            </Text>
          )}
        </Box>
        {cookies.username === user.username && (
          <Link href="/account">
            <a>
              <Button>My account</Button>
            </a>
          </Link>
        )}
      </Box>
      <Text color="grey" mb={5}>
        User since {moment(user.created).format('Do MMM YYYY')}
      </Text>
      {userRole === 'admin' && (
        <Infobox mb={5}>
          <Text
            fontWeight={600}
            fontSize={1}
            mb={3}
            css={{ textTransform: 'uppercase' }}
          >
            Only admins can see this
          </Text>
          <ul>
            {user.email && <li>Email: {user.email}</li>}
            {user.invitedBy && (
              <li>
                Invited by:{' '}
                <Link href={`/user/${user.invitedBy.username}`}>
                  <a>{user.invitedBy.username}</a>
                </Link>
              </li>
            )}
          </ul>
        </Infobox>
      )}
      <Box
        display="grid"
        gridTemplateColumns={['1fr', 'repeat(3, 1fr)']}
        gridGap={4}
        mb={5}
      >
        <Box bg="sidebar" borderRadius={2} p={4}>
          <Text
            fontWeight={600}
            fontSize={1}
            mb={3}
            css={{ textTransform: 'uppercase' }}
            icon={BarChartSquare}
            iconColor="text"
          >
            Ratio
          </Text>
          <Text fontSize={5}>
            {user.ratio === -1 ? '∞' : user.ratio.toFixed(2)}
          </Text>
        </Box>
        <Box bg="sidebar" borderRadius={2} p={4}>
          <Text
            fontWeight={600}
            fontSize={1}
            mb={3}
            css={{ textTransform: 'uppercase' }}
            icon={Download}
            iconColor="text"
          >
            Downloaded
          </Text>
          <Text fontSize={5}>
            {downloadedBytes[0]}
            <Text as="span" fontSize={4}>
              {' '}
              {downloadedBytes[1]}
            </Text>
          </Text>
        </Box>
        <Box bg="sidebar" borderRadius={2} p={4}>
          <Text
            fontWeight={600}
            fontSize={1}
            mb={3}
            css={{ textTransform: 'uppercase' }}
            icon={Upload}
            iconColor="text"
          >
            Uploaded
          </Text>
          <Text fontSize={5}>
            {uploadedBytes[0]}
            <Text as="span" fontSize={4}>
              {' '}
              {uploadedBytes[1]}
            </Text>
          </Text>
        </Box>
      </Box>
      <Text as="h2" mb={4}>
        Uploaded
      </Text>
      <Box mb={5}>
        <TorrentList
          torrents={user.torrents}
          categories={SQ_TORRENT_CATEGORIES}
        />
      </Box>
      <Text as="h2" mb={4}>
        Comments
      </Text>
      {user.comments?.length ? (
        <Box>
          {user.comments.map((comment) => (
            <Comment
              comment={{ ...comment, user: { username: user.username } }}
            />
          ))}
        </Box>
      ) : (
        <Text color="grey">No comments.</Text>
      )}
    </>
  )
}

export const getServerSideProps = async ({ req, query: { username } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  const userRes = await fetch(`${SQ_API_URL}/user/${username}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (userRes.status === 404) return { notFound: {} }

  const user = await userRes.json()
  return { props: { user, userRole: role } }
}

export default withAuth(User)
