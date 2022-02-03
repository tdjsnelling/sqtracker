import React, { useState } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Like } from '@styled-icons/boxicons-regular/Like'
import { Dislike } from '@styled-icons/boxicons-regular/Dislike'
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
import Modal from '../../components/Modal'

export const Info = ({ title, items }) => (
  <Infobox mb={5}>
    {title && (
      <Text
        fontWeight={600}
        fontSize={1}
        css={{ textTransform: 'uppercase' }}
        mb={4}
      >
        {title}
      </Text>
    )}
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
  const [showReportModal, setShowReportModal] = useState(false)
  const [userVote, setUserVote] = useState(
    (torrent.userHasUpvoted && 'up') ||
      (torrent.userHasDownvoted && 'down') ||
      null
  )
  const [votes, setVotes] = useState({
    up: torrent.upvotes,
    down: torrent.downvotes,
  })

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

  const handleVote = async (vote) => {
    try {
      if (userVote) {
        if (userVote === vote) {
          if (vote === 'up') setVotes((v) => ({ up: v.up - 1, down: v.down }))
          else if (vote === 'down')
            setVotes((v) => ({ up: v.up, down: v.down - 1 }))
          setUserVote(null)
        } else {
          if (vote === 'up') {
            setVotes((v) => ({ up: v.up + 1, down: v.down - 1 }))
          } else if (vote === 'down') {
            setVotes((v) => ({ up: v.up - 1, down: v.down + 1 }))
          }
          setUserVote(vote)
        }
      } else {
        if (vote === 'up') setVotes((v) => ({ up: v.up + 1, down: v.down }))
        else if (vote === 'down')
          setVotes((v) => ({ up: v.up, down: v.down + 1 }))
        setUserVote(vote)
      }

      const voteRes = await fetch(
        `${SQ_API_URL}/torrent/${userVote !== vote ? 'vote' : 'unvote'}/${
          torrent.infoHash
        }/${vote}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    try {
      const reportRes = await fetch(
        `${SQ_API_URL}/torrent/report/${torrent.infoHash}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: form.get('reason'),
          }),
        }
      )
      if (reportRes.ok) setShowReportModal(false)
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
            <>
              {torrent.uploadedBy ? (
                <Link href={`/user/${torrent.uploadedBy.username}`} passHref>
                  <Text as="a">{torrent.uploadedBy.username}</Text>
                </Link>
              ) : (
                'deleted user'
              )}
            </>
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
      <Box mb={5}>
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
      <Box
        display="flex"
        borderBottom="1px solid"
        borderColor="border"
        pb={5}
        mb={5}
      >
        <Button onClick={() => handleVote('up')} variant="noBackground" mr={2}>
          <Text icon={Like} iconColor={userVote === 'up' && 'green'}>
            {votes.up || 0}
          </Text>
        </Button>
        <Button
          onClick={() => handleVote('down')}
          variant="noBackground"
          mr={2}
        >
          <Text icon={Dislike} iconColor={userVote === 'down' && 'red'}>
            {votes.down || 0}
          </Text>
        </Button>
        <Button onClick={() => setShowReportModal(true)} variant="noBackground">
          Report
        </Button>
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
            <Comment key={comment._id} comment={{ ...comment, torrent }} />
          ))}
        </Box>
      )}
      {showReportModal && (
        <Modal close={() => setShowReportModal(false)}>
          <form onSubmit={handleReport}>
            <Input
              name="reason"
              label="Reason for report"
              rows={8}
              mb={4}
              required
            />
            <Button width="100%">Report</Button>
          </form>
        </Modal>
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
