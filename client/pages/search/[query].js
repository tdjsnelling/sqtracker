import React from 'react'
import getConfig from 'next/config'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import SEO from '../../components/SEO'

const Search = ({ results }) => {
  return (
    <>
      <SEO title="Results" />
      <h1>Results</h1>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { query } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  try {
    const searchRes = await fetch(`${SQ_API_URL}/torrents/search/${query}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const results = await searchRes.json()
    return { props: { results } }
  } catch (e) {
    return { props: {} }
  }
}

export default withAuth(Search, true)
