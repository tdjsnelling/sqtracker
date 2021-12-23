import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import { ListUl } from '@styled-icons/boxicons-regular/ListUl'
import { Download } from '@styled-icons/boxicons-regular/Download'
import { Chat } from '@styled-icons/boxicons-solid/Chat'
import withAuth from '../utils/withAuth'
import getReqCookies from '../utils/getReqCookies'
import Box from '../components/Box'
import Text from '../components/Text'
import SEO from '../components/SEO'
import Input from '../components/Input'
import Button from '../components/Button'
import List from '../components/List'

const PublicLanding = ({ name, allowRegister }) => (
  <Box
    minHeight="calc(100vh - 173px)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
  >
    <Text as="h1" fontSize={6}>
      {name}
    </Text>
    <Box display="flex" mt={4}>
      <Box>
        <Link href="/login">
          <a>Log in</a>
        </Link>
      </Box>
      {allowRegister && (
        <Box ml={3}>
          <Link href="/register">
            <a>Register</a>
          </Link>
        </Box>
      )}
    </Box>
  </Box>
)

const Index = ({ token, latest }) => {
  const {
    publicRuntimeConfig: {
      SQ_SITE_NAME,
      SQ_ALLOW_REGISTER,
      SQ_TORRENT_CATEGORIES,
    },
  } = getConfig()

  const router = useRouter()

  if (!token)
    return (
      <>
        <SEO />
        <PublicLanding name={SQ_SITE_NAME} allowRegister={SQ_ALLOW_REGISTER} />
      </>
    )

  const handleSearch = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const query = form.get('query')
    if (query) router.push(`/search/${encodeURIComponent(query)}`)
  }

  return (
    <>
      <SEO title="Home" />
      <Text as="h1" mb={5}>
        Home
      </Text>
      <Box as="form" onSubmit={handleSearch} display="flex" mb={5}>
        <Input placeholder="Search torrents" name="query" mr={3} required />
        <Button>Search</Button>
      </Box>
      <Text as="h2" mb={4}>
        Latest torrents
      </Text>
      <List
        data={latest.map((torrent) => ({
          ...torrent,
          href: `/torrent/${torrent.infoHash}`,
        }))}
        columns={[
          {
            accessor: 'name',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '2fr',
          },
          {
            accessor: 'type',
            cell: ({ value }) => (
              <Text icon={ListUl}>
                {SQ_TORRENT_CATEGORIES.find((c) => c.slug === value).name}
              </Text>
            ),
            gridWidth: '2fr',
          },
          {
            accessor: 'downloads',
            cell: ({ value }) => <Text icon={Download}>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            accessor: 'comments.count',
            cell: ({ value }) => <Text icon={Chat}>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            accessor: 'created',
            cell: ({ value }) => (
              <Text textAlign="right">
                {moment(value).format('Do MMM YYYY')}
              </Text>
            ),
            gridWidth: '1fr',
          },
        ]}
      />
    </>
  )
}

export const getServerSideProps = async ({ req }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  try {
    const latestRes = await fetch(`${SQ_API_URL}/torrents/latest`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const latest = await latestRes.json()
    return { props: { latest } }
  } catch (e) {
    return { props: {} }
  }
}

export default withAuth(Index, true)
