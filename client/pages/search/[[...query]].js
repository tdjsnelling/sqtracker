import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { withAuthServerSideProps } from '../../utils/withAuth'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Box from '../../components/Box'
import TorrentList from '../../components/TorrentList'

const Search = ({ results }) => {
  const router = useRouter()
  let {
    query: { query },
  } = router
  query = query ? decodeURIComponent(query) : ''

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  const handleSearch = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const query = form.get('query')
    if (query) router.push(`/search/${encodeURIComponent(query)}`)
  }

  return (
    <>
      <SEO title={query ? `Search results for “${query}”` : 'Search'} />
      <Text as="h1" mb={5}>
        {query ? `Search results for “${query}”` : 'Search'}
      </Text>
      <Box as="form" onSubmit={handleSearch} display="flex" mb={5}>
        <Input placeholder="Search torrents" name="query" mr={3} required />
        <Button>Search</Button>
      </Box>
      {results?.length ? (
        <TorrentList torrents={results} categories={SQ_TORRENT_CATEGORIES} />
      ) : (
        <Text color="grey">No results.</Text>
      )}
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, query: { query } }) => {
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
)

export default Search
