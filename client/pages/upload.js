import React, { useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import withAuth from '../utils/withAuth'
import SEO from '../components/SEO'
import Text from '../components/Text'

const Upload = ({ token, userId }) => {
  const [error, setError] = useState()

  const router = useRouter()

  const {
    publicRuntimeConfig: {
      SQ_BASE_URL,
      SQ_API_URL,
      SQ_TORRENT_CATEGORIES,
      SQ_ALLOW_ANONYMOUS_UPLOAD,
    },
  } = getConfig()

  const handleUpload = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const torrent = form.get('torrent')
      const reader = new FileReader()
      reader.onload = async () => {
        const b64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(reader.result))
        )
        const uploadRes = await fetch(`${SQ_API_URL}/torrent/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.get('name'),
            description: form.get('description'),
            type: form.get('category'),
            anonymous: form.get('anonymous') || false,
            torrent: b64,
          }),
        })
        if (uploadRes.ok) {
          const infoHash = await uploadRes.text()
          router.push(`/torrent/${infoHash}`)
        } else {
          const text = await uploadRes.text()
          setError(text)
        }
      }
      reader.readAsArrayBuffer(torrent)
    } catch (e) {
      console.error(e)
      setError(e.message)
    }
  }

  return (
    <>
      <SEO title="Upload" />
      <h1>Upload</h1>
      <p>
        {SQ_BASE_URL}/sq/{userId}/announce
      </p>
      <form onSubmit={handleUpload}>
        <input type="file" name="torrent" accept="application/x-bittorrent" />
        <input name="name" />
        <select name="category">
          {SQ_TORRENT_CATEGORIES.map((category) => (
            <option value={category}>{category}</option>
          ))}
        </select>
        <textarea name="description" rows="10" />
        {SQ_ALLOW_ANONYMOUS_UPLOAD && (
          <label>
            <input type="checkbox" name="anonymous" />
            Anonymous upload
          </label>
        )}
        <button>Upload</button>
        {error && <Text color="error">Error: {error}</Text>}
      </form>
    </>
  )
}

export default withAuth(Upload)
