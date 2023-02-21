import React from 'react'
import styled from 'styled-components'
import { layout, space, display, flexbox, variant } from 'styled-system'
import css from '@styled-system/css'
import { darken, lighten, getLuminance } from 'polished'

const StyledButton = styled.button(
  ({ theme, small }) =>
    css({
      appearance: 'none',
      bg: 'primary',
      color: getLuminance(theme.colors.primary) >= 0.5 ? '#202224' : '#f8f8f8',
      border: '2px solid',
      borderColor: 'primary',
      borderRadius: 1,
      fontFamily: 'body',
      fontSize: 2,
      px: 4,
      py: !small ? 3 : 2,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      '&:hover': {
        borderColor:
          theme.name === 'light'
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
      },
      '&:focus, &:active': {
        bg:
          theme.name === 'light'
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
        borderColor:
          theme.name === 'light'
            ? darken(0.1, theme.colors.primary)
            : lighten(0.1, theme.colors.primary),
      },
      '&[disabled]': {
        cursor: 'not-allowed',
        opacity: 0.5,
        '&:hover': {
          borderColor: 'primary',
        },
        '&:focus, &:active': {
          bg: 'primary',
        },
      },
    }),
  ({ theme }) =>
    variant({
      variants: {
        secondary: {
          bg: 'sidebar',
          color: 'text',
          borderColor: 'sidebar',
          '&:hover': {
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          '&:focus, &:active': {
            bg:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          '&[disabled]': {
            '&:hover': {
              borderColor: 'sidebar',
            },
            '&:focus, &:active': {
              bg: 'sidebar',
            },
          },
        },
        noBackground: {
          bg: 'transparent',
          color: 'text',
          borderColor: 'sidebar',
          '&:hover': {
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
          '&:focus, &:active': {
            bg:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.sidebar)
                : lighten(0.1, theme.colors.sidebar),
          },
        },
        danger: {
          bg: 'error',
          color: '#f8f8f8',
          borderColor: 'error',
          '&:hover': {
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
          },
          '&:focus, &:active': {
            bg:
              theme.name === 'light'
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
            borderColor:
              theme.name === 'light'
                ? darken(0.1, theme.colors.error)
                : lighten(0.1, theme.colors.error),
          },
          '&[disabled]': {
            '&:hover': {
              borderColor: 'sidebar',
            },
            '&:focus, &:active': {
              bg: 'sidebar',
            },
          },
        },
      },
    }),
  layout,
  space,
  display,
  flexbox
)

const Button = ({ onClick, disabled, ...rest }) => (
  <StyledButton
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    {...rest}
  />
)

export default Button
