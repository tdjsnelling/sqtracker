import React from 'react'
import getConfig from 'next/config'
import jwt from 'jsonwebtoken'
import styled from 'styled-components'
import css from '@styled-system/css'
import SEO from '../components/SEO'
import Text from '../components/Text'
import { withAuthServerSideProps } from '../utils/withAuth'

const StyledTable = styled.table(() =>
  css({
    borderCollapse: 'collapse',
    '&, td': {
      border: '1px solid',
      borderColor: 'border',
    },
    td: {
      px: 4,
      py: 3,
    },
  })
)

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
      <StyledTable>
        {Object.entries(stats).map(([key, value]) => {
          let readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase()
          readableKey =
            readableKey.charAt(0).toUpperCase() + readableKey.slice(1)
          return (
            <tr key={`stat-${key}`}>
              <td>{readableKey}</td>
              <td>{value}</td>
            </tr>
          )
        })}
      </StyledTable>
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(async ({ token }) => {
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
})

export default Stats
