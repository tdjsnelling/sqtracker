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
        color="text"
        css={{
          '&:visited': { color: 'text' },
          '&:hover': { bg: 'sidebar', textDecoration: 'none' },
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

const List = ({ data, columns, ...rest }) => {
  return (
    <Box>
      <Box
        display="grid"
        gridTemplateColumns={columns.map((col) => col.gridWidth).join(' ')}
        gridGap={4}
        alignItems="center"
        px={4}
        mb={3}
      >
        {columns.map((col) => (
          <Text
            fontWeight={600}
            fontSize={1}
            textAlign={col.rightAlign ? 'right' : 'left'}
            css={{ textTransform: 'uppercase' }}
          >
            {col.header}
          </Text>
        ))}
      </Box>
      <Box as="ul" css={{ listStyle: 'none' }} {...rest}>
        {data.length ? (
          data.map((row) => (
            <ListItem>
              <WrapLink href={row.href}>
                <Box
                  display="grid"
                  gridTemplateColumns={columns
                    .map((col) => col.gridWidth)
                    .join(' ')}
                  gridGap={4}
                  alignItems="center"
                  p={4}
                >
                  {columns.map((col) => (
                    <Box textAlign={col.rightAlign ? 'right' : 'left'}>
                      {col.cell({
                        value: col.accessor ? getIn(row, col.accessor) : null,
                        row,
                      })}
                    </Box>
                  ))}
                </Box>
              </WrapLink>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <Box p={4}>
              <Text color="grey">No items to show.</Text>
            </Box>
          </ListItem>
        )}
      </Box>
    </Box>
  )
}

export default List
