import React from 'react'
import getConfig from 'next/config'
import Link from 'next/link'
import { useCookies } from 'react-cookie'
import SEO from '../../components/SEO'
import getReqCookies from '../../utils/getReqCookies'
import withAuth from '../../utils/withAuth'

const User = ({ user }) => {
  const [cookies] = useCookies()
  return (
    <>
      <SEO title={`${user.username}’s profile`} />
      <h1>{user.username}</h1>
      {cookies.username === user.username && (
        <Link href="/account">
          <a>My account</a>
        </Link>
      )}
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = async ({ req, query: { username } }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const userRes = await fetch(`${SQ_API_URL}/user/${username}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const user = await userRes.json()
  return { props: { user } }
}

export default withAuth(User)
