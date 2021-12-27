import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import { BarChartSquare } from '@styled-icons/boxicons-regular/BarChartSquare'
import { Upload } from '@styled-icons/boxicons-regular/Upload'
import { Download } from '@styled-icons/boxicons-regular/Download'
import getReqCookies from '../../utils/getReqCookies'
import withAuth from '../../utils/withAuth'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import TorrentList from '../../components/TorrentList'
import Comment from '../../components/Comment'

const User = ({ user }) => {
  const [cookies] = useCookies()

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  const downloadedBytes = prettyBytes(user.downloaded?.bytes || 0).split(' ')
  const uploadedBytes = prettyBytes(user.uploaded?.bytes || 0).split(' ')

  return (
    <>
      <SEO title={`${user.username}’s profile`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1">{user.username}’s profile</Text>
        {cookies.username === user.username && (
          <Link href="/account">
            <a>
              <Button>My account</Button>
            </a>
          </Link>
        )}
      </Box>
      <Text color="grey" mb={4}>
        User since {moment(user.created).format('Do MMM YYYY')}
      </Text>
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
      {!!user.comments?.length && (
        <Box>
          {user.comments.map((comment) => (
            <Comment
              comment={{ ...comment, user: { username: user.username } }}
            />
          ))}
        </Box>
      )}
    </>
  )
}

export const getServerSideProps = async ({ req, query: { username } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const userRes = await fetch(`${SQ_API_URL}/user/${username}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const user = await userRes.json()
  return { props: { user } }
}

export default withAuth(User)
