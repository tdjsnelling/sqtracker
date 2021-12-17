import React from 'react'
import getConfig from 'next/config'
import Box from '../components/Box'
import Text from '../components/Text'

const Index = () => {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()

  return (
    <Box
      height="calc(100vh - 64px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text as="h1" fontSize={6}>
        {SQ_SITE_NAME}
      </Text>
    </Box>
  )
}

export default Index
