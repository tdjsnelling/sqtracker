import React from 'react'
import { useRouter } from 'next/router'
import getConfig from 'next/config'
import getReqCookies from '../../utils/getReqCookies'

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
      <h1>Browse {category.name}</h1>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { category } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  try {
    const searchRes = await fetch(
      `${SQ_API_URL}/torrents/search?category=${encodeURIComponent(category)}`,
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

export default Category
