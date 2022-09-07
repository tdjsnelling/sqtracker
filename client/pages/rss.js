import React from 'react'
import getConfig from 'next/config'
import SEO from '../components/SEO'
import Text from '../components/Text'

const Rss = () => {
  const {
    publicRuntimeConfig: { SQ_BASE_URL },
  } = getConfig()

  return (
    <>
      <SEO title="RSS" />
      <Text as="h1" mb={4}>
        RSS
      </Text>
      <Text mb={4}>
        There is an RSS feed at <strong>{SQ_BASE_URL}/api/rss</strong>.
      </Text>
      <Text mb={4}>
        To authenticate yourself, you must provide the cookies{' '}
        <strong>username</strong> and <strong>password</strong> to the RSS
        endpoint, containing your username and your password respectively.
      </Text>
      <Text mb={4}>
        If no query parameters are provided, the RSS feed will contain the 100
        latest torrents.
      </Text>
      <Text>
        To only include matching results in the feed, you can add the{' '}
        <strong>query</strong> query parameter, e.g.{' '}
        <strong>/api/rss?query=loremipsum</strong>.
      </Text>
    </>
  )
}

export default Rss
