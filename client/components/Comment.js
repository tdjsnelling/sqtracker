import React from 'react'
import Link from 'next/link'
import moment from 'moment'
import { Comment as CommentIcon } from '@styled-icons/boxicons-regular/Comment'
import Box from './Box'
import Text from './Text'

const Comment = ({ comment }) => {
  return (
    <Box
      p={4}
      borderTop="1px solid"
      borderColor="border"
      css={{
        '&:last-child': {
          borderBottom: '1px solid',
          borderBottomColor: 'border',
        },
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        {comment.user?.username ? (
          <Text color="grey" icon={CommentIcon}>
            Comment by{' '}
            <Link href={`/user/${comment.user.username}`} passHref>
              <Text as="a">{comment.user.username}</Text>
            </Link>
            {comment.torrent && (
              <>
                {' '}
                on{' '}
                <Link href={`/torrent/${comment.torrent.infoHash}`} passHref>
                  <Text as="a">{comment.torrent.name}</Text>
                </Link>
              </>
            )}
          </Text>
        ) : (
          <Text>Comment by deleted user</Text>
        )}
        <Text color="grey">
          Posted {moment(comment.created).format('HH:mm Do MMM YYYY')}
        </Text>
      </Box>
      <Text>{comment.comment}</Text>
    </Box>
  )
}

export default Comment
