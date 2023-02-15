import React, { useState, useCallback, useContext } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import css from '@styled-system/css'
import { useDropzone } from 'react-dropzone'
import slugify from 'slugify'
import { Link as LinkIcon } from '@styled-icons/boxicons-regular/Link'
import { Check } from '@styled-icons/boxicons-regular/Check'
import { withAuth } from '../utils/withAuth'
import SEO from '../components/SEO'
import Box from '../components/Box'
import Text from '../components/Text'
import Input, { WrapLabel } from '../components/Input'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import Infobox from '../components/Infobox'
import { NotificationContext } from '../components/Notifications'
import LoadingContext from '../utils/LoadingContext'

const FileUpload = styled(Box)(() =>
  css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '4px dashed',
    borderColor: 'border',
    borderRadius: 2,
    cursor: 'pointer',
    p: 5,
    '&:hover': {
      bg: 'sidebar',
    },
  })
)

const Upload = ({ token, userId }) => {
  const [torrentFile, setTorrentFile] = useState()

  const { addNotification } = useContext(NotificationContext)
  const { setLoading } = useContext(LoadingContext)

  const router = useRouter()

  const onDrop = useCallback((acceptedFiles) => {
    const [file] = acceptedFiles
    if (file) {
      const reader = new FileReader()
      reader.onload = async () => {
        console.log(reader.result)
        const [, b64] = reader.result.split('base64,')
        setTorrentFile({ name: file.name, b64 })
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'application/x-bittorrent',
    maxFiles: 1,
  })

  const {
    publicRuntimeConfig: {
      SQ_BASE_URL,
      SQ_API_URL,
      SQ_TORRENT_CATEGORIES,
      SQ_ALLOW_ANONYMOUS_UPLOAD,
    },
  } = getConfig()

  const handleUpload = async (e) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.target)

    try {
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
          anonymous: !!form.get('anonymous'),
          torrent: torrentFile.b64,
          tags: form.get('tags'),
        }),
      })

      if (uploadRes.status !== 200) {
        const reason = await uploadRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Torrent uploaded successfully')

      const infoHash = await uploadRes.text()
      router.push(`/torrent/${infoHash}`)
    } catch (e) {
      addNotification('error', `Could not upload torrent: ${e.message}`)
      console.error(e)
    }

    setLoading(false)
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
          <Text
            as="strong"
            fontFamily="mono"
            _css={{ userSelect: 'all', wordBreak: 'break-all' }}
          >
            {SQ_BASE_URL}/sq/{userId}/announce
          </Text>{' '}
          or upload will be rejected
        </Text>
      </Box>
      <form onSubmit={handleUpload}>
        <Box mb={4}>
          <WrapLabel label="Torrent file" as="div">
            <FileUpload {...getRootProps()}>
              <input {...getInputProps()} />
              {torrentFile ? (
                <Text icon={Check} iconColor="success" iconSize={24} ml={2}>
                  {torrentFile.name}
                </Text>
              ) : isDragActive ? (
                <Text color="grey">Drop the file here...</Text>
              ) : (
                <Text color="grey">
                  Drag and drop .torrent file here, or click to select
                </Text>
              )}
            </FileUpload>
          </WrapLabel>
        </Box>
        <Input name="name" label="Name" mb={4} required />
        <Select name="category" label="Category" mb={4} required>
          {SQ_TORRENT_CATEGORIES.map((category) => (
            <option key={category} value={slugify(category, { lower: true })}>
              {category}
            </option>
          ))}
        </Select>
        <Input
          name="description"
          label="Description"
          rows="10"
          placeholder="Markdown supported"
          mb={4}
          required
        />
        <Input
          name="tags"
          label="Tags"
          placeholder="Separated by commas"
          mb={4}
        />
        {SQ_ALLOW_ANONYMOUS_UPLOAD && (
          <Checkbox name="anonymous" label="Anonymous upload" />
        )}
        <Button display="block" ml="auto" mt={5}>
          Upload
        </Button>
      </form>
      <Infobox mt={5}>
        <Text color="grey" fontSize={1}>
          Note: if you have started seeding a torrent before uploading, you made
          need to refresh trackers in your torrent client once the upload is
          complete.
        </Text>
      </Infobox>
    </>
  )
}

export default withAuth(Upload)
