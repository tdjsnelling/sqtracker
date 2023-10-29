import React from "react";
import styled from "styled-components";
import { layout, space, typography } from "styled-system";
import css from "@styled-system/css";
import { ChevronDown } from "@styled-icons/boxicons-regular";
import Box from "./Box";
import { WrapLabel } from "./Input";

const StyledSelect = styled.select(
  () =>
    css({
      appearance: "none",
      display: "block",
      bg: "sidebar",
      color: "text",
      border: "2px solid",
      borderColor: "sidebar",
      borderRadius: 1,
      fontFamily: "body",
      fontSize: 2,
      pl: 4,
      pr: 6,
      py: 3,
      "&:focus": {
        borderColor: "primary",
        outline: 0,
      },
    }),
  layout,
  space,
  typography
);

const Select = ({ label, required, fRef, ...rest }) => {
  return (
    <WrapLabel label={label && required ? `${label} *` : label}>
      <Box position="relative" display="inline-block">
        <StyledSelect {...rest} ref={fRef} required={required} />
        <Box
          position="absolute"
          top="7px"
          right={4}
          color="grey"
          _css={{ pointerEvents: "none" }}
        >
          <ChevronDown size={22} />
        </Box>
      </Box>
    </WrapLabel>
  );
};

export default React.forwardRef((props, ref) => (
  <Select {...props} fRef={ref} />
));
