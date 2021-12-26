import styled from 'styled-components'
import { layout, space, variant } from 'styled-system'
import css from '@styled-system/css'
import { darken } from 'polished'

const StyledButton = styled.button(
  ({ theme }) =>
    css({
      appearance: 'none',
      bg: 'primary',
      color: 'background',
      border: '2px solid',
      borderColor: 'primary',
      borderRadius: 1,
      fontFamily: 'body',
      fontSize: 2,
      px: 4,
      py: 3,
      cursor: 'pointer',
      '&:hover': {
        borderColor: darken(0.1, theme.colors.primary),
      },
      '&:focus, &:active': {
        bg: darken(0.1, theme.colors.primary),
        borderColor: darken(0.1, theme.colors.primary),
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
            borderColor: darken(0.1, theme.colors.sidebar),
          },
          '&:focus, &:active': {
            bg: darken(0.1, theme.colors.sidebar),
            borderColor: darken(0.1, theme.colors.sidebar),
          },
        },
      },
    }),
  layout,
  space
)

export default StyledButton
