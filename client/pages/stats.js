import React from 'react'
import getConfig from 'next/config'
import jwt from 'jsonwebtoken'
import SEO from '../components/SEO'
import Text from '../components/Text'
import withAuth from '../utils/withAuth'
import getReqCookies from '../utils/getReqCookies'

const Stats = ({ stats, userRole }) => {
  if (userRole !== 'admin') {
    return <Text>You do not have permission to do that.</Text>
  }

  return (
    <>
      <SEO title="Stats" />
      <Text as="h1" mb={5}>
        Stats
      </Text>
      <ul>
        {Object.entries(stats).map(([key, value]) => (
          <li>{`${key}: ${value}`}</li>
        ))}
      </ul>
    </>
  )
}

export const getServerSideProps = async ({ req }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role } = jwt.verify(token, SQ_JWT_SECRET)

  if (role !== 'admin') return { props: { reports: [], userRole: role } }

  const statsRes = await fetch(`${SQ_API_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const stats = await statsRes.json()
  return { props: { stats, userRole: role } }
}

export default withAuth(Stats)
