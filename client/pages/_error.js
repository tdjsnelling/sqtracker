import React from 'react'
import Link from 'next/link'
import SEO from '../components/SEO'
import Text from '../components/Text'

const Error = () => (
  <>
    <SEO title="Not found" />
    <Text as="h1" mb={5}>
      Something went wrong :(
    </Text>
    <Text>
      If the error persists, please{' '}
      <a href="https://github.com/tdjsnelling/sqtracker/issues" target="_blank">
        report it
      </a>
      . For now,{' '}
      <Link href="/" passHref>
        <a>return home</a>
      </Link>
      .
    </Text>
  </>
)

export default Error
