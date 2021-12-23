import React from 'react'
import Link from 'next/link'
import { toPath } from 'lodash'
import Box from '../components/Box'
import Text from '../components/Text'

const getIn = (obj, key, p = 0) => {
  const path = toPath(key)
  while (obj && p < path.length) {
    obj = obj[path[p++]]
  }
  return obj
}

const WrapLink = ({ href, children }) =>
  href ? (
    <Link href={href} passHref>
      <Text
        as="a"
        display="block"
        color="black"
        css={{
          '&:visited': { color: 'black' },
          '&:hover': { bg: 'offWhite', textDecoration: 'none' },
        }}
      >
        {children}
      </Text>
    </Link>
  ) : (
    children
  )

const ListItem = ({ children }) => {
  return (
    <Box
      as="li"
      borderBottom="1px solid"
      borderColor="border"
      css={{
        '&:first-child': { borderTopWidth: '1px', borderTopStyle: 'solid' },
      }}
    >
      {children}
    </Box>
  )
}

const List = ({ data, columns }) => {
  return (
    <Box as="ul" css={{ listStyle: 'none' }}>
      {data.map((row) => (
        <ListItem>
          <WrapLink href={row.href}>
            <Box
              display="grid"
              gridTemplateColumns={columns
                .map((col) => col.gridWidth)
                .join(' ')}
              gridGap={4}
              p={3}
            >
              {columns.map((col) =>
                col.cell({ value: getIn(row, col.accessor), row })
              )}
            </Box>
          </WrapLink>
        </ListItem>
      ))}
    </Box>
  )
}

export default List
