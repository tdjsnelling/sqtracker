import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import Button from '../../components/Button'
import List from '../../components/List'

const Reports = ({ reports }) => {
  return (
    <>
      <SEO title="Unresolved reports" />
      <Text as="h1" mb={5}>
        Reports
      </Text>
      <List
        data={reports.map((report) => ({
          ...report,
          href: `/reports/${report._id}`,
        }))}
        columns={[
          {
            header: 'Torrent',
            accessor: 'torrent.name',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            header: 'Reported by',
            accessor: 'reportedBy.username',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            header: 'Reason',
            accessor: 'reason',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1fr',
          },
          {
            header: 'Created',
            accessor: 'created',
            cell: ({ value }) => (
              <Text>{moment(value).format('HH:mm Do MMM YYYY')}</Text>
            ),
            rightAlign: true,
            gridWidth: '1fr',
          },
        ]}
      />
    </>
  )
}

export const getServerSideProps = async ({ req }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const reportsRes = await fetch(`${SQ_API_URL}/reports/page/0`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const reports = await reportsRes.json()
  return { props: { reports } }
}

export default withAuth(Reports)
