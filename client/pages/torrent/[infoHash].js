import React from 'react'
import getConfig from 'next/config'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Comment from '../../components/Comment'

const Torrent = ({ token, torrent }) => {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_API_URL },
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
      <Box as="pre" mb={5}>
        {JSON.stringify(torrent, null, 2)}
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
            <Comment comment={comment} />
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
