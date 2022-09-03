import React, { useState, useContext } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import jwt from 'jsonwebtoken'
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
import { NotificationContext } from '../../components/Notifications'

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

const Torrent = ({ token, torrent, userId, userRole, uid }) => {
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userVote, setUserVote] = useState(
    (torrent.userHasUpvoted && 'up') ||
      (torrent.userHasDownvoted && 'down') ||
      null
  )
  const [votes, setVotes] = useState({
    up: torrent.upvotes,
    down: torrent.downvotes,
  })
  const [isFreeleech, setIsFreeleech] = useState(torrent.freeleech)

  const { addNotification } = useContext(NotificationContext)

  const {
    publicRuntimeConfig: {
      SQ_SITE_NAME,
      SQ_API_URL,
      SQ_TORRENT_CATEGORIES,
      SQ_SITE_WIDE_FREELEECH,
    },
  } = getConfig()

  const router = useRouter()

  const handleDownload = async () => {
    try {
      const downloadRes = await fetch(
        `${SQ_API_URL}/torrent/download/${torrent.infoHash}/${uid}`
      )

      if (downloadRes.status !== 200) {
        const reason = await downloadRes.text()
        throw new Error(reason)
      }

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
      addNotification('error', `Could not download torrent: ${e.message}`)
      console.error(e)
    }
  }

  const handleDelete = async () => {
    try {
      const deleteRes = await fetch(
        `${SQ_API_URL}/torrent/delete/${torrent.infoHash}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (deleteRes.status !== 200) {
        const reason = await deleteRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Torrent deleted successfully')

      router.push('/')
    } catch (e) {
      addNotification('error', `Could not delete torrent: ${e.message}`)
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

      if (commentRes.status !== 200) {
        const reason = await commentRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Comment posted successfully')
    } catch (e) {
      addNotification('error', `Could not post comment: ${e.message}`)
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

      if (voteRes.status !== 200) {
        const reason = await voteRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Vote submitted successfully')
    } catch (e) {
      addNotification('error', `Could not submit vote: ${e.message}`)
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

      if (reportRes.status !== 200) {
        const reason = await reportRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Report submitted successfully')

      setShowReportModal(false)
    } catch (e) {
      addNotification('error', `Could not submit report: ${e.message}`)
      console.error(e)
    }
  }

  const handleToggleFreeleech = async () => {
    try {
      const toggleRes = await fetch(
        `${SQ_API_URL}/torrent/toggle-freeleech/${torrent.infoHash}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (toggleRes.status !== 200) {
        const reason = await toggleRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Freeleech toggled successfully')

      setIsFreeleech((f) => !f)
    } catch (e) {
      addNotification('error', `Could toggle freeleech: ${e.message}`)
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
        <Box variant="flex" alignItems="center">
          {(userRole === 'admin' || userId === torrent.uploadedBy._id) && (
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="secondary"
              mr={3}
            >
              Delete
            </Button>
          )}
          {userRole === 'admin' && (
            <Button onClick={handleToggleFreeleech} variant="secondary" mr={3}>
              {isFreeleech ? 'Unset' : 'Set'} freeleech
            </Button>
          )}
          <Button onClick={handleDownload}>Download</Button>
        </Box>
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
          Freeleech:
            torrent.freeleech || SQ_SITE_WIDE_FREELEECH === true ? 'Yes' : 'No',
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
        <Button display="block" ml="auto">
          Post
        </Button>
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
      {showDeleteModal && (
        <Modal close={() => setShowDeleteModal(false)}>
          <Text mb={5}>
            Are you sure you want to delete this torrent? This cannot be undone.
          </Text>
          <Box display="flex" justifyContent="flex-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              mr={3}
            >
              Cancel
            </Button>
            <Button onClick={handleDelete}>Delete</Button>
          </Box>
        </Modal>
      )}
    </>
  )
}

export const getServerSideProps = async ({ req, query: { infoHash } }) => {
  const { token, userId } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { id, role } = jwt.verify(token, SQ_JWT_SECRET)

  const torrentRes = await fetch(`${SQ_API_URL}/torrent/info/${infoHash}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (torrentRes.status === 404) return { notFound: true }

  const torrent = await torrentRes.json()
  return { props: { torrent, userId: id, userRole: role, uid: userId } }
}

export default withAuth(Torrent)
