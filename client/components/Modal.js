import React from "react";
import { X } from "@styled-icons/boxicons-regular";
import Box from "./Box";
import Button from "./Button";

const Modal = ({ children, close }) => {
  return (
    <Box
      position="fixed"
      top={0}
      bottom={0}
      left={0}
      right={0}
      bg="rgba(0, 0, 0, 0.66)"
      zIndex={10}
    >
      <Box
        position="absolute"
        top="100px"
        left="50%"
        bg="background"
        border="1px solid"
        borderColor="border"
        borderRadius={2}
        maxWidth="600px"
        maxHeight="calc(100vh - 200px)"
        width="100%"
        _css={{ transform: "translateX(-50%)" }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          borderBottom="1px solid"
          borderColor="border"
          height="60px"
          px={5}
        >
          <Button onClick={close} variant="noBackground" px={3} py={1}>
            <X size={20} />
          </Button>
        </Box>
        <Box maxHeight="calc(100vh - 200px - 60px)" overflow="auto" p={5}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Modal;
