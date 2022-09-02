import styled from 'styled-components'
import { layout, space, display, flexbox, variant } from 'styled-system'
import css from '@styled-system/css'
import { darken, lighten, getLuminance } from 'polished'

const StyledButton = styled.button(
  ({ theme }) =>
    css({
      appearance: 'none',
      bg: 'primary',
      color: getLuminance(theme.colors.primary) >= 0.5 ? '#000' : '#fff',
      border: '2px solid',
      borderColor: 'primary',
      borderRadius: 1,
      fontFamily: 'body',
      fontSize: 2,
      px: 4,
      py: 3,
      cursor: 'pointer',
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
