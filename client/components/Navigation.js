import React, { useContext } from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import styled, { ThemeContext } from 'styled-components'
import css from '@styled-system/css'
import { X } from '@styled-icons/boxicons-regular/X'
import { Home } from '@styled-icons/boxicons-regular/Home'
import { ListUl } from '@styled-icons/boxicons-regular/ListUl'
import { Search } from '@styled-icons/boxicons-regular/Search'
import { Upload } from '@styled-icons/boxicons-regular/Upload'
import { News } from '@styled-icons/boxicons-regular/News'
import { User } from '@styled-icons/boxicons-regular/User'
import { Exit } from '@styled-icons/boxicons-regular/Exit'
import Box from './Box'
import Text from './Text'
import Button from './Button'

const NavLink = styled.a(({ theme, href, highlights = [], mt = 0 }) => {
  const router = useRouter()
  const { asPath } = router

  const active =
    href === '/'
      ? asPath === '/'
      : asPath.startsWith(href) ||
        highlights.some((link) => asPath.startsWith(link))

  return css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    color: active ? 'primary' : `${theme.colors.text} !important`,
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

const Navigation = ({ isMobile, menuIsOpen, setMenuIsOpen }) => {
  const [cookies] = useCookies()

  const { username } = cookies

  const theme = useContext(ThemeContext)

  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()

  if (isMobile && !menuIsOpen) return null

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width={`calc((100vw - ${theme.sizes.body}) / 2)`}
      minWidth="200px"
      bg="sidebar"
      borderRight="1px solid"
      borderColor="border"
      textAlign="right"
      zIndex={10}
    >
      <Box
        as="header"
        display="flex"
        alignItems="center"
        justifyContent={['space-between', 'flex-end']}
        width="100%"
        height="60px"
        borderBottom="1px solid"
        borderColor="border"
        px={4}
      >
        <Button
          onClick={() => setMenuIsOpen(false)}
          display={['block', 'none']}
          px={1}
          py={1}
        >
          <X size={20} />
        </Button>
        <Link href="/" passHref>
          <Text
            as="a"
            fontSize={3}
            fontWeight={600}
            color="text"
            css={{ textDecoration: 'none', '&:visited': { color: 'text' } }}
          >
            {SQ_SITE_NAME}
          </Text>
        </Link>
      </Box>
      <Box as="nav" maxWidth="300px" ml="auto" py={4}>
        {cookies.token && (
          <Box display="grid" gridAutoFlow="row" gridGap={0}>
            <Link href="/" passHref>
              <NavLink>
                <Text>Home</Text>
                <Home size={24} />
              </NavLink>
            </Link>
            <Link href="/categories" passHref>
              <NavLink>
                <Text>Browse</Text>
                <ListUl size={24} />
              </NavLink>
            </Link>
            <Link href="/search" passHref>
              <NavLink>
                <Text>Search</Text>
                <Search size={24} />
              </NavLink>
            </Link>
            <Link href="/upload" passHref>
              <NavLink>
                <Text>Upload</Text>
                <Upload size={24} />
              </NavLink>
            </Link>
            <Link href="/announcements" passHref>
              <NavLink>
                <Text>Announcements</Text>
                <News size={24} />
              </NavLink>
            </Link>
            <Link href={`/user/${username}`} passHref>
              <NavLink highlights={['/account']}>
                <Text>{username}</Text>
                <User size={24} />
              </NavLink>
            </Link>
            <Link href="/logout" passHref>
              <NavLink mt={5}>
                <Text>Log out</Text>
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
        <Text color="grey" fontSize={1}>
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
