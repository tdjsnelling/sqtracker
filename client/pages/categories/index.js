import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import styled from 'styled-components'
import css from '@styled-system/css'
import withAuth from '../../utils/withAuth'
import SEO from '../../components/SEO'
import Box from '../../components/Box'
import Text from '../../components/Text'

const CategoryItem = styled.li(() =>
  css({
    bg: 'sidebar',
    height: '150px',
    borderRadius: 2,
    a: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 3,
    },
  })
)

const Categories = () => {
  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  return (
    <>
      <SEO title="Categories" />
      <Text as="h1" mb={5}>
        Categories
      </Text>
      <Box
        as="ul"
        display="grid"
        gridTemplateColumns="repeat(4, 1fr)"
        gridGap={4}
        css={{ listStyle: 'none' }}
      >
        {SQ_TORRENT_CATEGORIES.map((category) => (
          <CategoryItem key={category.slug}>
            <Link href={`/categories/${category.slug}`} passHref>
              <a>{category.name}</a>
            </Link>
          </CategoryItem>
        ))}
      </Box>
    </>
  )
}

export default withAuth(Categories)
