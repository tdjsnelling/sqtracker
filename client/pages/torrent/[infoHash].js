import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Infobox from '../../components/Infobox'
import MarkdownBody from '../../components/MarkdownBody'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Comment from '../../components/Comment'

const Info = ({ items }) => (
  <Infobox mb={5}>
    <Box display="grid" gridTemplateColumns="1fr" gridGap={2}>
      {Object.entries(items).map(([key, val], i) => (
        <Box
          key={`infobox-row-${i}`}
          display="grid"
          gridTemplateColumns={['1fr', '1fr 2fr']}
          gridGap={2}
          alignItems="center"
        >
          <Text
            fontWeight={600}
            fontSize={1}
            css={{ textTransform: 'uppercase' }}
          >
            {key}
          </Text>
          <Text>{val}</Text>
        </Box>
      ))}
    </Box>
  </Infobox>
)

const Torrent = ({ token, torrent }) => {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL, SQ_TORRENT_CATEGORIES },
  } = getConfig()

  const handleDownload = async () => {
    try {
      const downloadRes = await fetch(
        `${SQ_API_URL}/torrent/download/${torrent.infoHash}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const blob = await downloadRes.blob()

      const url = window.URL.createObjectURL(blob)

      const downloadLink = document.createElement('a')
      document.body.appendChild(downloadLink)
      downloadLink.style = 'display: none'
      downloadLink.href = url
      downloadLink.download = `${torrent.name} (${SQ_SITE_NAME}).torrent`
      downloadLink.click()

      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const commentRes = await fetch(
        `${SQ_API_URL}/torrent/comment/${torrent.infoHash}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: form.get('comment'),
          }),
        }
      )
    } catch (e) {
      console.error(e)
    }
  }

  const category = SQ_TORRENT_CATEGORIES.find((c) => c.slug === torrent.type)

  return (
    <>
      <SEO title={torrent.name} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1">{torrent.name}</Text>
        <Button onClick={handleDownload}>Download</Button>
      </Box>
      <Info
        items={{
          'Uploaded by': torrent.anonymous ? (
            'Anonymous'
          ) : (
            <Link href={`/user/${torrent.uploadedBy.username}`} passHref>
              <Text as="a">{torrent.uploadedBy.username}</Text>
            </Link>
          ),
          Category: (
            <Link href={`/categories/${category.slug}`} passHref>
              <Text as="a">{category.name}</Text>
            </Link>
          ),
          Date: moment(torrent.created).format('HH:mm Do MMM YYYY'),
          'Info hash': (
            <Text as="span" fontFamily="mono" css={{ userSelect: 'all' }}>
              {torrent.infoHash}
            </Text>
          ),
          Size: prettyBytes(torrent.size),
          Downloads: torrent.downloads,
          Seeders: torrent.seeders,
          Leechers: torrent.leechers,
        }}
      />

      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <Text
          fontWeight={600}
          fontSize={1}
          css={{ textTransform: 'uppercase' }}
          mb={3}
        >
          Description
        </Text>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {torrent.description}
          </ReactMarkdown>
        </MarkdownBody>
      </Box>

      <Text as="h2" mb={4}>
        Comments
      </Text>
      <form onSubmit={handleComment}>
        <Input name="comment" label="Post a comment" rows="5" mb={4} />
        <Button>Post</Button>
      </form>
      {!!torrent.comments?.length && (
        <Box mt={5}>
          {torrent.comments.map((comment) => (
            <Comment key={comment._id} comment={comment} />
          ))}
        </Box>
      )}
    </>
  )
}

export const getServerSideProps = async ({ req, query: { infoHash } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const torrentRes = await fetch(`${SQ_API_URL}/torrent/info/${infoHash}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const torrent = await torrentRes.json()
  return { props: { torrent } }
}

export default withAuth(Torrent)
