import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import withAuth from '../utils/withAuth'
import getReqCookies from '../utils/getReqCookies'
import Box from '../components/Box'
import Text from '../components/Text'
import SEO from '../components/SEO'

const PublicLanding = ({ name, allowRegister }) => (
  <Box
    minHeight="calc(100vh - 116px)"
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
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_ALLOW_REGISTER },
  } = getConfig()

  if (!token)
    return (
      <>
        <SEO />
        <PublicLanding name={SQ_SITE_NAME} allowRegister={SQ_ALLOW_REGISTER} />
      </>
    )

  return (
    <>
      <SEO title="Home" />
      <h1>Logged in</h1>
      <Link href="/logout">
        <a>Log out</a>
      </Link>
      <pre>{JSON.stringify(latest, null, 2)}</pre>
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
