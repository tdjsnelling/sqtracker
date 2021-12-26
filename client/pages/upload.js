import React, { useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { Link as LinkIcon } from '@styled-icons/boxicons-regular/Link'
import withAuth from '../utils/withAuth'
import SEO from '../components/SEO'
import Box from '../components/Box'
import Text from '../components/Text'
import Input from '../components/Input'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'

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
      <Text as="h1" mb={4}>
        Upload
      </Text>
      <Box mb={5}>
        <Text icon={LinkIcon} iconColor="primary">
          Announce URL must be set to{' '}
          <Text as="span" fontFamily="mono" css={{ userSelect: 'all' }}>
            {SQ_BASE_URL}/sq/{userId}/announce
          </Text>
        </Text>
      </Box>
      <form onSubmit={handleUpload}>
        <Input
          name="torrent"
          type="file"
          accept="application/x-bittorrent"
          label="Torrent file"
          mb={4}
          required
        />
        <Input name="name" label="Name" mb={4} required />
        <Select name="category" label="Category" mb={4} required>
          {SQ_TORRENT_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          name="description"
          label="Description"
          rows="10"
          mb={4}
          required
        />
        {SQ_ALLOW_ANONYMOUS_UPLOAD && (
          <Checkbox name="anonymous" label="Anonymous upload" />
        )}
        <Button display="block" ml="auto" mt={5}>
          Upload
        </Button>
        {error && <Text color="error">Error: {error}</Text>}
      </form>
    </>
  )
}

export default withAuth(Upload)
