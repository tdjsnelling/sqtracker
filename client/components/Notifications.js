import React, { createContext, useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { X } from "@styled-icons/boxicons-regular/X";
import Box from "./Box";
import Button from "./Button";

const delay = 5000;
const animation = 200;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(300px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(300px);
  }
`;

const StyledNotification = styled(Box)`
  &.slideIn {
    animation: ${slideIn} ${animation}ms forwards;
  }
  &.slideOut {
    animation: ${slideOut} ${animation}ms forwards;
  }
`;

const Notification = ({ type, text, dismiss }) => {
  const [className, setClassName] = useState("slideIn");

  useEffect(() => {
    setTimeout(() => {
      setClassName("slideOut");
    }, delay + animation);
  }, []);

  return (
    <StyledNotification
      className={className}
      display="flex"
      alignItems="flex-start"
      justifyContent="space-between"
      bg="sidebar"
      border="1px solid"
      borderColor={type}
      borderLeftWidth="5px"
      borderRadius={1}
      boxShadow="edge"
      minWidth={["calc(100vw - 40px)", "400px"]}
      maxWidth="400px"
      px={4}
      py={3}
    >
      <Box mt="1px">{text}</Box>
      <Button
        onClick={() => {
          setClassName("slideOut");
          setTimeout(dismiss, animation);
        }}
        variant="noBackground"
        width="24px"
        height="24px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={0}
        ml={3}
      >
        <X size={16} />
      </Button>
    </StyledNotification>
  );
};

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
});

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, text) => {
    setNotifications((existing) => {
      const n = [...existing];
      n.push({ type, text });
      return n;
    });
    setTimeout(() => {
      setNotifications((existing) => {
        const n = [...existing];
        n.shift();
        return n;
      });
    }, delay + animation * 2);
  };

  const removeNotification = (index) => {
    setNotifications((existing) => {
      const n = [...existing];
      n.splice(index, 1);
      return n;
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      <Box
        position="fixed"
        top="60px"
        right="0px"
        p="20px"
        pb="40px"
        overflowX="hidden"
        zIndex={999}
        _css={{ "> * + *": { mt: 3 } }}
      >
        {notifications.map((notification, i) => (
          <Notification
            key={`notification-${i}`}
            dismiss={() => removeNotification(i)}
            {...notification}
          />
        ))}
      </Box>
      {children}
    </NotificationContext.Provider>
  );
};
