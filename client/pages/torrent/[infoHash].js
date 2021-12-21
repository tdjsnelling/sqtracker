import React from 'react'
import getConfig from 'next/config'
import withAuth from '../../utils/withAuth'
import getReqCookies from '../../utils/getReqCookies'
import SEO from '../../components/SEO'

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
      <h1>{torrent.name}</h1>
      <pre>{JSON.stringify(torrent, null, 2)}</pre>
      <button type="button" onClick={handleDownload}>
        Download
      </button>
      <h2>Comments</h2>
      <form onSubmit={handleComment}>
        <textarea name="comment" rows="10" />
        <button>Post</button>
      </form>
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
