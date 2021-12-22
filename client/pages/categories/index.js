import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'

const Categories = () => {
  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig()

  return (
    <>
      <h1>Categories</h1>
      <ul>
        {SQ_TORRENT_CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link href={`/categories/${category.slug}`} passHref>
              <a>{category.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Categories
