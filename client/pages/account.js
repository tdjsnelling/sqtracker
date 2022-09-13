import React, { useState, useContext } from 'react'
import getConfig from 'next/config'
import moment from 'moment'
import copy from 'copy-to-clipboard'
import jwt from 'jsonwebtoken'
import { Copy } from '@styled-icons/boxicons-regular/Copy'
import { Check } from '@styled-icons/boxicons-regular/Check'
import { X } from '@styled-icons/boxicons-regular/X'
import { withAuthServerSideProps } from '../utils/withAuth'
import SEO from '../components/SEO'
import Box from '../components/Box'
import Text from '../components/Text'
import Infobox from '../components/Infobox'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import List from '../components/List'
import { NotificationContext } from '../components/Notifications'
import Modal from '../components/Modal'

const Account = ({ token, invites = [], user, userRole }) => {
  const [invitesList, setInvitesList] = useState(invites)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const { addNotification } = useContext(NotificationContext)

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig()

  const handleGenerateInvite = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      const inviteRes = await fetch(`${SQ_API_URL}/account/generate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: form.get('role') || 'user',
          email: form.get('email'),
        }),
      })

      if (inviteRes.status !== 200) {
        const reason = await inviteRes.text()
        throw new Error(reason)
      }

      const invite = await inviteRes.json()
      setInvitesList((cur) => {
        const currentInvitesList = [...cur]
        currentInvitesList.unshift(invite)
        return currentInvitesList
      })

      addNotification('success', 'Invite sent successfully')

      setShowInviteModal(false)
    } catch (e) {
      addNotification('error', `Could not send invite: ${e.message}`)
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

      if (changePasswordRes.status !== 200) {
        const reason = await changePasswordRes.text()
        throw new Error(reason)
      }

      addNotification('success', 'Password changed successfully')

      const fields = e.target.querySelectorAll('input')
      for (const field of fields) {
        field.value = ''
        field.blur()
      }
    } catch (e) {
      addNotification('error', `Could not change password: ${e.message}`)
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
        <Box
          display="flex"
          alignItems="center"
          bg="sidebar"
          borderRadius={1}
          p={2}
          pl={4}
        >
          <Text color="grey" mr={4}>
            {user.remainingInvites || 0} remaining
          </Text>
          <Button
            onClick={() => setShowInviteModal(true)}
            disabled={(user.remainingInvites || 0) < 1}
          >
            Send invite
          </Button>
        </Box>
      </Box>
      <List
        data={invitesList}
        columns={[
          {
            header: 'Email',
            accessor: 'email',
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: '1.75fr',
          },
          {
            header: 'Claimed',
            accessor: 'claimed',
            cell: ({ value }) => (
              <Box color={value ? 'success' : 'grey'}>
                {value ? <Check size={24} /> : <X size={24} />}{' '}
              </Box>
            ),
            gridWidth: '0.5fr',
          },
          {
            header: 'Valid until',
            accessor: 'validUntil',
            cell: ({ value }) => (
              <Text color={value < Date.now() ? 'error' : 'text'}>
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
            gridWidth: '1.2fr',
          },
          ...(userRole === 'admin'
            ? [
                {
                  header: 'Role',
                  accessor: 'role',
                  cell: ({ value }) => (
                    <Text _css={{ textTransform: 'capitalize' }}>{value}</Text>
                  ),
                  gridWidth: '0.6fr',
                },
              ]
            : []),
          {
            header: 'Copy link',
            cell: ({ row }) => {
              return (
                <Button
                  variant="secondary"
                  onClick={() => {
                    copy(
                      `${location.protocol}//${location.host}/register?token=${row.token}`
                    )
                    addNotification(
                      'success',
                      'Invite link copied to clipboard'
                    )
                  }}
                  disabled={row.claimed || row.validUntil < Date.now()}
                  px={1}
                  py={1}
                >
                  <Copy size={24} />
                </Button>
              )
            },
            rightAlign: true,
            gridWidth: '80px',
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
      {showInviteModal && (
        <Modal close={() => setShowInviteModal(false)}>
          <Text mb={5}>
            Enter an email address to send an invite. The invited user will need
            to sign up with the same email address. Once the invite is
            generated, you can also copy a direct invite link.
          </Text>
          <form onSubmit={handleGenerateInvite}>
            <Input name="email" type="email" label="Email" mb={4} required />
            {userRole === 'admin' && (
              <Select name="role" mb={4} required>
                <option value="user">Role: user</option>
                <option value="admin">Role: admin</option>
              </Select>
            )}
            <Box display="flex" justifyContent="flex-end">
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="secondary"
                mr={3}
              >
                Cancel
              </Button>
              <Button>Send invite</Button>
            </Box>
          </form>
        </Modal>
      )}
    </>
  )
}

export const getServerSideProps = withAuthServerSideProps(async ({ token }) => {
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
})

export default Account
