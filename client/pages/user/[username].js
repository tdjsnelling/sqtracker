import React from 'react'
import getConfig from 'next/config'
import SEO from '../../components/SEO'
import getReqCookies from '../../utils/getReqCookies'

const User = ({ user }) => {
  return (
    <>
      <SEO title={`${user.username}’s profile`} />
      <h1>{user.username}</h1>
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

export default User
