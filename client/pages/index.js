import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { withAuthServerSideProps } from '../utils/withAuth'
import Box from '../components/Box'
import Text from '../components/Text'
import SEO from '../components/SEO'
import Input from '../components/Input'
import Button from '../components/Button'
import TorrentList from '../components/TorrentList'
import Infobox from '../components/Infobox'
import { ErrorCircle } from '@styled-icons/boxicons-regular/ErrorCircle'
import { News } from '@styled-icons/boxicons-regular/News'
import moment from 'moment/moment'

const PublicLanding = ({ name, allowRegister }) => (
  <Box
    minHeight="calc(100vh - 173px)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
  >
    <Text as="h1" fontSize={6} textAlign="center" lineHeight={1.2}>
      {name}
    </Text>
    <Box display="flex" mt={4}>
      <Box>
        <Link href="/login">
          <a>Log in</a>
        </Link>
      </Box>
      {allowRegister && (
        <Box ml={4}>
          <Link href="/register">
            <a>Register</a>
          </Link>
        </Box>
      )}
    </Box>
  </Box>
)

const Index = ({
  token,
  latestTorrents,
  latestAnnouncement,
  emailVerified,
}) => {
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

  console.log(latestAnnouncement)

  return (
    <>
      <SEO title="Home" />
      <Text as="h1" mb={5}>
        Home
      </Text>
      {!emailVerified && (
        <Infobox mb={5}>
          <Text icon={ErrorCircle} iconColor="error">
            Your email address is not yet verified. You will not be able to
            upload or download any data until this is done.
          </Text>
        </Infobox>
      )}
      {latestAnnouncement && (
        <Link href={`/announcements/${latestAnnouncement.slug}`} passHref>
          <Box
            as="a"
            _css={{
              '&:hover': {
                textDecoration: 'none',
                h2: { textDecoration: 'underline' },
              },
            }}
          >
            <Infobox mb={5}>
              <Text
                icon={News}
                iconColor="primary"
                color="grey"
                fontWeight={600}
                fontSize={1}
                _css={{ textTransform: 'uppercase' }}
                mb={3}
              >
                Latest announcement
              </Text>
              <Text as="h2" fontSize={3} mb={3}>
                {latestAnnouncement.title}
              </Text>
              <Text color="grey">
                Posted{' '}
                {moment(latestAnnouncement.created).format('HH:mm Do MMM YYYY')}{' '}
                by{' '}
                {latestAnnouncement.createdBy?.username ? (
                  <Link
                    href={`/user/${latestAnnouncement.createdBy.username}`}
                    passHref
                  >
                    <a>{latestAnnouncement.createdBy.username}</a>
                  </Link>
                ) : (
                  'deleted user'
                )}
              </Text>
            </Infobox>
          </Box>
        </Link>
      )}
      <Box as="form" onSubmit={handleSearch} display="flex" mb={5}>
        <Input placeholder="Search torrents" name="query" mr={3} required />
        <Button>Search</Button>
      </Box>
      <Text as="h2" mb={4}>
        Latest torrents
      </Text>
      <TorrentList
        torrents={latestTorrents}
        categories={SQ_TORRENT_CATEGORIES}
      />
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders }) => {
    if (!token) return { props: {} }

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig()

    try {
      const latestTorrentsRes = await fetch(`${SQ_API_URL}/torrent/latest`, {
        headers: fetchHeaders,
      })
      if (
        latestTorrentsRes.status === 403 &&
        (await latestTorrentsRes.text()) === 'User is banned'
      ) {
        throw 'banned'
      }
      const latestTorrents = await latestTorrentsRes.json()

      const latestAnnouncementRes = await fetch(
        `${SQ_API_URL}/announcements/page/0?count=1`,
        {
          headers: fetchHeaders,
        }
      )
      const [latestAnnouncement] = await latestAnnouncementRes.json()

      const verifiedRes = await fetch(`${SQ_API_URL}/account/get-verified`, {
        headers: fetchHeaders,
      })
      const emailVerified = await verifiedRes.json()

      return {
        props: { latestTorrents, latestAnnouncement, emailVerified, token },
      }
    } catch (e) {
      if (e === 'banned') throw 'banned'
      return { props: {} }
    }
  },
  true
)

export default Index
