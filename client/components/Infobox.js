import React from "react";
import Box from "./Box";

const Infobox = ({ children, ...rest }) => (
  <Box
    bg="sidebar"
    border="1px solid"
    borderColor="border"
    borderRadius={1}
    p={4}
    {...rest}
  >
    {children}
  </Box>
);

export default Infobox;
