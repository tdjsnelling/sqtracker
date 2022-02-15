import React, { createContext, useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import Box from './Box'

const delay = 5000
const animation = 200

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(300px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(300px);
  }
`

const StyledNotification = styled(Box)`
  &.slideIn {
    animation: ${slideIn} ${animation}ms forwards;
  }
  &.slideOut {
    animation: ${slideOut} ${animation}ms forwards;
  }
`

const Notification = ({ type, text }) => {
  const [className, setClassName] = useState('slideIn')

  useEffect(() => {
    setTimeout(() => {
      setClassName('slideOut')
    }, delay + animation)
  }, [])

  return (
    <StyledNotification
      className={className}
      bg="sidebar"
      border="1px solid"
      borderColor={type}
      borderLeftWidth="5px"
      borderRadius={1}
      boxShadow="edge"
      minWidth="400px"
      maxWidth="400px"
      px={4}
      py={3}
    >
      {text}
    </StyledNotification>
  )
}

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
})

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (type, text) => {
    setNotifications((existing) => {
      const n = [...existing]
      n.push({ type, text })
      return n
    })
    setTimeout(() => {
      setNotifications((existing) => {
        const n = [...existing]
        n.shift()
        return n
      })
    }, delay + animation * 2)
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      <Box
        position="absolute"
        top="60px"
        right="0px"
        p="20px"
        pb="40px"
        overflowX="hidden"
        css={{ '> * + *': { mt: 3 } }}
      >
        {notifications.map((notification, i) => (
          <Notification key={`notification-${i}`} {...notification} />
        ))}
      </Box>
      {children}
    </NotificationContext.Provider>
  )
}
