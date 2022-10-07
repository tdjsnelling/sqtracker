import React, { useState, useContext, useRef } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import jwt from 'jsonwebtoken'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCookies } from 'react-cookie'
import { Pin } from '@styled-icons/boxicons-regular'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Button from '../../components/Button'
import MarkdownBody from '../../components/MarkdownBody'
import { withAuthServerSideProps } from '../../utils/withAuth'
import { NotificationContext } from '../../components/Notifications'
import Input from '../../components/Input'
import Comment from '../../components/Comment'

const Request = ({ request, token, user }) => {
  const [comments, setComments] = useState(request.comments)

  const { addNotification } = useContext(NotificationContext)

  const commentInputRef = useRef()

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const router = useRouter()

  const [cookies] = useCookies()

  const handleDelete = async () => {
    try {
      const deleteRes = await fetch(`${SQ_API_URL}/requests/${request.index}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (deleteRes.status !== 200) {
        const reason = await deleteRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Request deleted successfully')

      router.push('/requests')
    } catch (e) {
      addNotification('error', `Could not delete request: ${e.message}`)
      console.error(e)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const commentRes = await fetch(
        `${SQ_API_URL}/requests/comment/${request._id}`,
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

      setComments((c) => {
        const newComment = {
          comment: form.get('comment'),
          created: Date.now(),
          user: {
            username: cookies.username,
          },
        }
        return [newComment, ...c]
      })

      commentInputRef.current.value = ''
    } catch (e) {
      addNotification('error', `Could not post comment: ${e.message}`)
      console.error(e)
    }
  }

  return (
    <>
      <SEO title={`${request.title} | Request`} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Text as="h1">{request.title}</Text>
        </Box>
        {user === request.createdBy._id && (
          <Button onClick={handleDelete} variant="secondary">
            Delete
          </Button>
        )}
      </Box>
      <Box mb={5}>
        <Text color="grey">
          Posted {moment(request.created).format('HH:mm Do MMM YYYY')} by{' '}
          {request.createdBy?.username ? (
            <Link href={`/user/${request.createdBy.username}`} passHref>
              <a>{request.createdBy.username}</a>
            </Link>
          ) : (
            'deleted user'
          )}
        </Text>
      </Box>
      <Box borderBottom="1px solid" borderColor="border" pb={5} mb={5}>
        <MarkdownBody>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {request.body}
          </ReactMarkdown>
        </MarkdownBody>
      </Box>
      <Box>
        <Text as="h2" mb={4}>
          Comments
        </Text>
        <form onSubmit={handleComment}>
          <Input
            ref={commentInputRef}
            name="comment"
            label="Post a comment"
            rows="5"
            mb={4}
          />
          <Button display="block" ml="auto">
            Post
          </Button>
        </form>
        {!!comments?.length && (
          <Box mt={5}>
            {comments.map((comment) => (
              <Comment
                key={comment._id || comment.created}
                comment={{ ...comment, request }}
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, query: { index } }) => {
    if (!token) return { props: {} }

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig()

    const { id } = jwt.verify(token, SQ_JWT_SECRET)

    try {
      const requestRes = await fetch(`${SQ_API_URL}/requests/${index}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (
        requestRes.status === 403 &&
        (await requestRes.text()) === 'User is banned'
      ) {
        throw 'banned'
      }
      const request = await requestRes.json()
      return { props: { request, token, user: id } }
    } catch (e) {
      if (e === 'banned') throw 'banned'
      return { props: {} }
    }
  }
)

export default Request
