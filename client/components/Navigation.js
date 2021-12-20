import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import Box from './Box'
import Text from './Text'

const Navigation = () => {
  const [cookies] = useCookies()

  const { username } = cookies

  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()

  return (
    <Box as="header" borderBottom="1px solid" borderColor="border">
      <Box
        as="nav"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        height="55px"
        maxWidth="body"
        px={3}
        mx="auto"
      >
        <Link href="/" passHref>
          <Text
            as="a"
            fontWeight={500}
            color="black"
            css={{ textDecoration: 'none', '&:visited': { color: 'black' } }}
          >
            {SQ_SITE_NAME}
          </Text>
        </Link>
        {cookies.token && (
          <Box display="grid" gridAutoFlow="column" gridGap={3}>
            <Link href="/upload">
              <a>Upload</a>
            </Link>
            <Link href={`/user/${username}`}>
              <a>{username}</a>
            </Link>
            <Link href="/logout">
              <a>Log out</a>
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Navigation
