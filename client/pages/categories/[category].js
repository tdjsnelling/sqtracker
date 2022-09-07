import React from 'react'
import { useRouter } from 'next/router'
import getConfig from 'next/config'
import qs from 'qs'
import { withAuthServerSideProps } from '../../utils/withAuth'
import SEO from '../../components/SEO'
import Text from '../../components/Text'
import TorrentList from '../../components/TorrentList'

const Category = ({ results }) => {
  const router = useRouter()
  const {
    query: { category: categorySlug },
  } = router

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  const category = SQ_TORRENT_CATEGORIES.find((c) => c.slug === categorySlug)

  return (
    <>
      <SEO title={`Browse ${category.name}`} />
      <Text as="h1" mb={5}>
        Browse {category.name}
      </Text>
      {results?.torrents.length ? (
        <TorrentList
          torrents={results.torrents}
          categories={SQ_TORRENT_CATEGORIES}
          total={results.total}
        />
      ) : (
        <Text color="grey">No results.</Text>
      )}
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, query: { category, page: pageParam } }) => {
    if (!token) return { props: {} }

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig()

    const params = {
      category: encodeURIComponent(category),
    }
    const page = pageParam ? parseInt(pageParam) : 0
    if (page > 0) params.page = page

    try {
      const searchRes = await fetch(
        `${SQ_API_URL}/torrents/search?${qs.stringify(params)}`,
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

export default Category
