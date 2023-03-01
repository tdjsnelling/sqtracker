import React from "react";
import styled from "styled-components";
import { layout, space, display, flexbox, variant } from "styled-system";
import css from "@styled-system/css";
import { darken, lighten, getLuminance } from "polished";

const StyledButton = styled.button(
  ({ theme, small }) =>
    css({
      appearance: "none",
      bg: "primary",
      color: `${
        getLuminance(theme.colors.primary) >= 0.5 ? "#202224" : "#f8f8f8"
      } !important`,
      border: "2px solid",
      borderColor: "primary",
      borderRadius: 1,
      fontFamily: "body",
      fontSize: 2,
      px: 4,
      py: !small ? 3 : 2,
      cursor: "pointer",
      whiteSpace: "nowrap",
      height: small ? "32px" : "40px",
      lineHeight: 1.25,
      "&:hover": {
        borderColor:
          theme.name === "light"
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
        textDecoration: "none",
      },
      "&:focus, &:active": {
        bg:
          theme.name === "light"
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
        borderColor:
          theme.name === "light"
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
      },
      "&[disabled]": {
        cursor: "not-allowed",
        opacity: 0.5,
        "&:hover": {
          borderColor: "primary",
        },
        "&:focus, &:active": {
          bg: "primary",
        },
      },
    }),
  ({ theme }) =>
    variant({
      variants: {
        secondary: {
          bg: "sidebar",
          color: `${theme.colors.text} !important`,
          borderColor: "sidebar",
          "&:hover": {
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          "&:focus, &:active": {
            bg:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          "&[disabled]": {
            "&:hover": {
              borderColor: "sidebar",
            },
            "&:focus, &:active": {
              bg: "sidebar",
            },
          },
        },
        noBackground: {
          bg: "transparent",
          color: "text",
          borderColor: "sidebar",
          "&:hover": {
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          "&:focus, &:active": {
            bg:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
        },
        danger: {
          bg: "error",
          color: "#f8f8f8",
          borderColor: "error",
          "&:hover": {
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
          },
          "&:focus, &:active": {
            bg:
              theme.name === "light"
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
            borderColor:
              theme.name === "light"
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
          },
          "&[disabled]": {
            "&:hover": {
              borderColor: "sidebar",
            },
            "&:focus, &:active": {
              bg: "sidebar",
            },
          },
        },
      },
    }),
  layout,
  space,
  display,
  flexbox
);

const Button = ({ onClick, disabled, fref, ...rest }) => (
  <StyledButton
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    ref={fref}
    {...rest}
  />
);

export default React.forwardRef((props, ref) => (
  <Button fref={ref} {...props} />
));
