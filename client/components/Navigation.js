import React, { useContext } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import styled, { ThemeContext } from 'styled-components'
import css from '@styled-system/css'
import { ListUl } from '@styled-icons/boxicons-regular/ListUl'
import { Search } from '@styled-icons/boxicons-regular/Search'
import { Upload } from '@styled-icons/boxicons-regular/Upload'
import { User } from '@styled-icons/boxicons-regular/User'
import { Exit } from '@styled-icons/boxicons-regular/Exit'
import Box from './Box'
import Text from './Text'

const NavLink = styled.a(({ theme, href, mt = 0 }) => {
  const router = useRouter()
  const { asPath } = router

  const active = asPath.startsWith(href)

  return css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    color: active ? 'primary' : `${theme.colors.black} !important`,
    background: active
      ? `linear-gradient(to right, rgba(0, 0, 0, 0), ${theme.colors.border})`
      : 'transparent',
    borderRight: '4px solid',
    borderColor: active ? 'primary' : 'transparent',
    fontWeight: 500,
    lineHeight: 1,
    px: 4,
    py: 3,
    mt,
    svg: {
      ml: 3,
    },
  })
})

const Navigation = () => {
  const [cookies] = useCookies()

  const { username } = cookies

  const theme = useContext(ThemeContext)

  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width={`calc((100vw - ${theme.sizes.body}) / 2)`}
      minWidth="60px"
      bg="offWhite"
      borderRight="1px solid"
      borderColor="border"
      textAlign="right"
    >
      <Box
        as="header"
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        width="100%"
        height="60px"
        borderBottom="1px solid"
        borderColor="border"
        px={4}
      >
        <Link href="/" passHref>
          <Text
            as="a"
            fontSize={3}
            fontWeight={600}
            color="black"
            css={{ textDecoration: 'none', '&:visited': { color: 'black' } }}
          >
            {SQ_SITE_NAME}
          </Text>
        </Link>
      </Box>
      <Box as="nav" maxWidth="300px" ml="auto" py={4}>
        {cookies.token && (
          <Box display="grid" gridAutoFlow="row" gridGap={0}>
            <Link href="/categories" passHref>
              <NavLink>
                Browse
                <ListUl size={24} />
              </NavLink>
            </Link>
            <Link href="/search" passHref>
              <NavLink>
                Search
                <Search size={24} />
              </NavLink>
            </Link>
            <Link href="/upload" passHref>
              <NavLink>
                Upload
                <Upload size={24} />
              </NavLink>
            </Link>
            <Link href={`/user/${username}`} passHref>
              <NavLink>
                {username}
                <User size={24} />
              </NavLink>
            </Link>
            <Link href="/logout" passHref>
              <NavLink mt={5}>
                Log out
                <Exit size={24} />
              </NavLink>
            </Link>
          </Box>
        )}
      </Box>
      <Box
        as="footer"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        borderTop="1px solid"
        borderColor="border"
        p={4}
      >
        <Text fontFamily="mono" fontSize={1}>
          Powered by{' '}
          <a href="https://github.com/tdjsnelling/sqtracker" target="_blank">
            ■ sqtracker
          </a>
        </Text>
      </Box>
    </Box>
  )
}

export default Navigation
