import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Box from '../../components/Box'

const Search = ({ results }) => {
  const router = useRouter()
  let {
    query: { query },
  } = router
  query = query ? decodeURIComponent(query) : ''

  const handleSearch = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const query = form.get('query')
    if (query) router.push(`/search/${encodeURIComponent(query)}`)
  }

  return (
    <>
      <SEO title={`Search results for “${query}”`} />
      <Text as="h1" mb={5}>
        {query ? `Search results for “${query}”` : 'Search'}
      </Text>
      <Box as="form" onSubmit={handleSearch} display="flex" mb={5}>
        <Input placeholder="Search torrents" name="query" mr={3} required />
        <Button>Search</Button>
      </Box>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { query } }) => {
  const { token } = getReqCookies(req)

  if (!token || !query) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  try {
    const searchRes = await fetch(
      `${SQ_API_URL}/torrents/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
    const results = await searchRes.json()
    return { props: { results } }
  } catch (e) {
    return { props: {} }
  }
}

export default withAuth(Search)
