import React from 'react'
import Link from 'next/link'
import moment from 'moment'
import { Comment as CommentIcon } from '@styled-icons/boxicons-regular/Comment'
import { File } from '@styled-icons/boxicons-regular/File'
import { News } from '@styled-icons/boxicons-regular/News'
import { CommentAdd } from '@styled-icons/boxicons-regular/CommentAdd'
import Box from './Box'
import Text from './Text'

const Comment = ({ comment }) => {
  const isTorrent = !comment.announcement && !comment.request
  const isAnnouncement = !comment.torrent && !comment.request
  const isRequest = !comment.torrent && !comment.announcement

  return (
    <Box
      p={4}
      borderTop="1px solid"
      borderColor="border"
      _css={{
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
            </Link>{' '}
            on{' '}
            {isTorrent && (
              <>
                {comment.torrent ? (
                  <Link href={`/torrent/${comment.torrent.infoHash}`} passHref>
                    <Text
                      as="a"
                      icon={File}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: 'text-bottom' },
                      }}
                    >
                      {comment.torrent.name}
                    </Text>
                  </Link>
                ) : (
                  'deleted torrent'
                )}
              </>
            )}
            {isAnnouncement && (
              <>
                {comment.announcement ? (
                  <Link
                    href={`/announcements/${comment.announcement.slug}`}
                    passHref
                  >
                    <Text
                      as="a"
                      icon={News}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: 'text-bottom' },
                      }}
                    >
                      {comment.announcement.title}
                    </Text>
                  </Link>
                ) : (
                  'deleted announcement'
                )}
              </>
            )}
            {isRequest && (
              <>
                {comment.request ? (
                  <Link href={`/requests/${comment.request.index}`} passHref>
                    <Text
                      as="a"
                      icon={CommentAdd}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: 'text-bottom' },
                      }}
                    >
                      {comment.request.title}
                    </Text>
                  </Link>
                ) : (
                  'deleted request'
                )}
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
