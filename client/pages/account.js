import React, { useState } from 'react'
import getConfig from 'next/config'
import moment from 'moment'
import copy from 'copy-to-clipboard'
import jwt from 'jsonwebtoken'
import { Copy } from '@styled-icons/boxicons-regular/Copy'
import withAuth from '../utils/withAuth'
import getReqCookies from '../utils/getReqCookies'
import SEO from '../components/SEO'
import Box from '../components/Box'
import Text from '../components/Text'
import Infobox from '../components/Infobox'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import List from '../components/List'

const Account = ({ token, invites = [], user, userRole }) => {
  const [invitesList, setInvitesList] = useState(invites)

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleGenerateInvite = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const inviteRes = await fetch(
        `${SQ_API_URL}/account/generate-invite?role=${
          form.get('role') || 'user'
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
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
      {userRole === 'admin' && (
        <Infobox mb={5}>
          <Text>This is an admin account.</Text>
        </Infobox>
      )}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <Text as="h2">Invites</Text>
        <form onSubmit={handleGenerateInvite}>
          <Box
            display="flex"
            alignItems="center"
            border="1px solid"
            borderColor="border"
            borderRadius={1}
            p={2}
            pl={4}
          >
            <Text color="grey" mr={4}>
              {user.remainingInvites} remaining
            </Text>
            {userRole === 'admin' && (
              <Select name="role" required mr={3}>
                <option value="user">Role: user</option>
                <option value="admin">Role: admin</option>
              </Select>
            )}
            <Button disabled={user.remainingInvites < 1}>
              Generate invite
            </Button>
          </Box>
        </form>
      </Box>
      <List
        data={invitesList}
        columns={[
          {
            header: 'Token',
            accessor: 'token',
            cell: ({ value }) => (
              <Text fontFamily="monospace">
                ...{value.slice(value.length - 16)}
              </Text>
            ),
            gridWidth: '1fr',
          },
          {
            header: 'Claimed',
            accessor: 'claimed',
            cell: ({ value }) => <Text>{value ? 'Yes' : 'No'}</Text>,
            gridWidth: '0.5fr',
          },
          {
            header: 'Valid until',
            accessor: 'validUntil',
            cell: ({ value }) => (
              <Text
                style={{
                  textDecoration: value < Date.now() ? 'line-through' : 'none',
                }}
              >
                {moment(value).format('HH:mm Do MMM YYYY')}
              </Text>
            ),
            gridWidth: '1.2fr',
          },
          {
            header: 'Created',
            accessor: 'created',
            cell: ({ value }) => (
              <Text>{moment(value).format('HH:mm Do MMM YYYY')}</Text>
            ),
            gridWidth: '1fr',
          },
          {
            header: 'Role',
            accessor: 'role',
            cell: ({ value }) => (
              <Text css={{ textTransform: 'capitalize' }}>{value}</Text>
            ),
            gridWidth: '0.6fr',
          },
          {
            header: 'Copy',
            cell: ({ row }) => {
              console.log(row)
              return (
                <Button
                  variant="secondary"
                  onClick={() => {
                    copy(
                      `${location.protocol}//${location.host}/register?token=${row.token}`
                    )
                    alert('Invite link copied to clipboard')
                  }}
                  disabled={row.claimed}
                  px={1}
                  py={1}
                >
                  <Copy size={24} />
                </Button>
              )
            },
            rightAlign: true,
            gridWidth: '42px',
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
          autoComplete="new-password"
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
    serverRuntimeConfig: { SQ_JWT_SECRET },
  } = getConfig()

  const { role, username } = jwt.verify(token, SQ_JWT_SECRET)

  try {
    const userRes = await fetch(`${SQ_API_URL}/user/${username}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const user = await userRes.json()
    const invitesRes = await fetch(`${SQ_API_URL}/account/invites`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const invites = await invitesRes.json()
    return { props: { invites, user, userRole: role } }
  } catch (e) {
    return { props: {} }
  }
}

export default withAuth(Account)
