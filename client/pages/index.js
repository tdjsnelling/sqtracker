import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import Box from '../components/Box'
import Text from '../components/Text'

const Index = () => {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()

  return (
    <Box
      minHeight="calc(100vh - 116px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Text as="h1" fontSize={6}>
        {SQ_SITE_NAME}
      </Text>
      <Box display="flex" mt={4}>
        <Box mr={3}>
          <Link href="/login">
            <a>Log in</a>
          </Link>
        </Box>
        <Box>
          <Link href="/register">
            <a>Register</a>
          </Link>
        </Box>
      </Box>
    </Box>
  )
}

export default Index
