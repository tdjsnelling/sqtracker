import React from "react";
import styled from "styled-components";
import { space } from "styled-system";
import css from "@styled-system/css";
import { transparentize } from "polished";
import Box from "./Box";
import Text from "./Text";

const Container = styled.label(
  ({ theme }) =>
    css({
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      input: {
        opacity: 0,
        height: 0,
        width: 0,
        "&:focus, &:active": {
          "& ~ .check": {
            borderColor: "primary",
            bg: transparentize(0.8, theme.colors.primary),
          },
        },
        "&:checked": {
          "& ~ .check": {
            borderColor: "primary",
            ".inner": {
              // prettier-ignore
              backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill:%23${theme.colors.text.replace('#','')}"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"></path></svg>')`,
              backgroundPosition: "center",
              backgroundSize: "18px 18px",
            },
          },
        },
      },
      ".check": {
        display: "inline-flex",
        bg: "grey9",
        border: "2px solid",
        borderColor: "text",
        borderRadius: 1,
        width: "20px",
        height: "20px",
      },
      ".inner": {
        width: "20px",
        height: "20px",
      },
    }),
  space
);

const Checkbox = ({ label, name, inputProps, ...rest }) => (
  <Container {...rest}>
    <input type="checkbox" name={name} {...inputProps} />
    <Box alignItems="center" justifyContent="center" className="check">
      <Box className="inner" />
    </Box>
    <Text as="span" display="inline-block" ml={3} lineHeight="22px">
      {label}
    </Text>
  </Container>
);

export default Checkbox;
