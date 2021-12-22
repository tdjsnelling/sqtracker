import React from 'react'
import SEO from '../components/SEO'
import withAuth from '../utils/withAuth'
import getConfig from 'next/config'
import getReqCookies from '../utils/getReqCookies'

const Account = ({ token, invites }) => {
  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleGenerateInvite = async () => {
    try {
      const inviteRes = await fetch(`${SQ_API_URL}/account/generate-invite`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const invite = await inviteRes.json()
      console.log(invite)
    } catch (e) {
      console.error(e)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const changePasswordRes = await fetch(
        `${SQ_API_URL}/account/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: form.get('password'),
            newPassword: form.get('newPassword'),
          }),
        }
      )
      console.log(changePasswordRes.status)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <SEO title="My account" />
      <h1>My account</h1>
      <h2>Invites</h2>
      <button onClick={handleGenerateInvite}>Generate invite</button>
      <pre>{JSON.stringify(invites, null, 2)}</pre>
      <h2>Change password</h2>
      <form onSubmit={handleChangePassword}>
        <input name="password" />
        <input name="newPassword" />
        <button>Change password</button>
      </form>
    </>
  )
}

export const getServerSideProps = async ({ req }) => {
  const { token } = getReqCookies(req)

  if (!token) return { props: {} }

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  try {
    const invitesRes = await fetch(`${SQ_API_URL}/account/invites`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const invites = await invitesRes.json()
    return { props: { invites } }
  } catch (e) {
    return { props: {} }
  }
}

export default withAuth(Account)
