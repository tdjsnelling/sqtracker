import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import Infobox from '../../components/Infobox'
import MarkdownBody from '../../components/MarkdownBody'
import { Info } from '../torrent/[infoHash]'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'

const Report = ({ report, token }) => {
  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const router = useRouter()

  const handleResolve = async () => {
    try {
      const resolveRes = await fetch(
        `${SQ_API_URL}/reports/resolve/${report._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (resolveRes.ok) {
        router.push('/reports')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <SEO title={`Report on “${report.torrent.name}” | Reports`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Text as="h1">Report on “{report.torrent.name}”</Text>
        <Button onClick={handleResolve}>Mark as solved</Button>
      </Box>
      <Text color="grey" mb={5}>
        Reported {moment(report.created).format('HH:mm Do MMM YYYY')} by{' '}
        <Link href={`/user/${report.reportedBy.username}`} passHref>
          <a>{report.reportedBy.username}</a>
        </Link>
      </Text>
      <Info
        title="Torrent details"
        items={{
          Name: (
            <Link href={`/torrent/${report.torrent.infoHash}`} passHref>
              <a>{report.torrent.name}</a>
            </Link>
          ),
          Description: report.torrent.description,
          'Info hash': report.torrent.infoHash,
          Created: moment(report.torrent.created).format('HH:mm Do MMM YYYY'),
        }}
      />
      <Text
        fontWeight={600}
        fontSize={1}
        css={{ textTransform: 'uppercase' }}
        mb={4}
      >
        Reason for report
      </Text>
      <MarkdownBody>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.reason}
        </ReactMarkdown>
      </MarkdownBody>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { id } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const reportRes = await fetch(`${SQ_API_URL}/reports/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const report = await reportRes.json()
  return { props: { report, token } }
}

export default withAuth(Report)
