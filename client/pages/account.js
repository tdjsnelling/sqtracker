import React, { useState } from 'react'
import getConfig from 'next/config'
import moment from 'moment'
import copy from 'copy-to-clipboard'
import { Copy } from '@styled-icons/boxicons-regular/Copy'
import withAuth from '../utils/withAuth'
import getReqCookies from '../utils/getReqCookies'
import SEO from '../components/SEO'
import Box from '../components/Box'
import Text from '../components/Text'
import Input from '../components/Input'
import Button from '../components/Button'
import List from '../components/List'

const Account = ({ token, invites }) => {
  const [invitesList, setInvitesList] = useState(invites)

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
      setInvitesList((cur) => {
        const currentInvitesList = [...cur]
        currentInvitesList.unshift(invite)
        return currentInvitesList
      })
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
      <Text as="h1" mb={5}>
        My account
      </Text>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <Text as="h2">Invites</Text>
        <Button onClick={handleGenerateInvite}>Generate invite</Button>
      </Box>
      <List
        data={invitesList}
        columns={[
          {
            accessor: 'token',
            cell: ({ value }) => (
              <Text fontFamily="monospace">
                {value.slice(0, 10)}...{value.slice(value.length - 10)}
              </Text>
            ),
            gridWidth: '1fr',
          },
          {
            accessor: 'claimed',
            cell: ({ value }) => (
              <Text>{value ? 'Claimed' : 'Not claimed'}</Text>
            ),
            gridWidth: '0.5fr',
          },
          {
            accessor: 'validUntil',
            cell: ({ value }) => (
              <Text>
                Valid until {moment(value).format('HH:mm Do MMM YYYY')}
              </Text>
            ),
            gridWidth: '1.2fr',
          },
          {
            accessor: 'created',
            cell: ({ value }) => (
              <Text>Created {moment(value).format('Do MMM YYYY')}</Text>
            ),
            gridWidth: '1fr',
          },
          {
            cell: ({ row }) => (
              <Button
                variant="secondary"
                onClick={() => {
                  copy(
                    `${location.protocol}//${location.host}/register?token=${row.token}`
                  )
                  alert('Invite link copied to clipboard')
                }}
                px={1}
                py={1}
              >
                <Copy size={24} />
              </Button>
            ),
            gridWidth: '32px',
          },
        ]}
        mb={5}
      />
      <Text as="h2" mb={4}>
        Change password
      </Text>
      <form onSubmit={handleChangePassword}>
        <Input
          name="password"
          type="password"
          label="Current password"
          mb={4}
          required
        />
        <Input
          name="newPassword"
          type="password"
          label="New password"
          mb={4}
          required
        />
        <Button>Change password</Button>
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
