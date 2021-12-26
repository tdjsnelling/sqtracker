import React from 'react'
import styled from 'styled-components'
import { space } from 'styled-system'
import css from '@styled-system/css'
import { transparentize } from 'polished'
import Box from './Box'
import Text from './Text'

const Container = styled.label(
  ({ theme }) =>
    css({
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      input: {
        opacity: 0,
        height: 0,
        width: 0,
        '&:focus, &:active': {
          '& ~ .check': {
            borderColor: 'primary',
            bg: transparentize(0.8, theme.colors.primary),
          },
        },
        '&:checked': {
          '& ~ .check': {
            borderColor: 'primary',
            '.inner': {
              backgroundImage:
                "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0ibTEwIDE1LjU4Ni0zLjI5My0zLjI5My0xLjQxNCAxLjQxNEwxMCAxOC40MTRsOS43MDctOS43MDctMS40MTQtMS40MTR6Ij48L3BhdGg+PC9zdmc+')",
              backgroundPosition: 'center',
              backgroundSize: '18px 18px',
            },
          },
        },
      },
      '.check': {
        display: 'inline-flex',
        bg: 'grey9',
        border: '2px solid',
        borderColor: 'text',
        borderRadius: 1,
        width: '20px',
        height: '20px',
      },
      '.inner': {
        width: '20px',
        height: '20px',
      },
    }),
  space
)

const Checkbox = ({ label, name, ...rest }) => (
  <Container {...rest}>
    <input type="checkbox" name={name} />
    <Box alignItems="center" justifyContent="center" className="check">
      <Box className="inner" />
    </Box>
    <Text as="span" display="inline-block" ml={3} lineHeight="22px">
      {label}
    </Text>
  </Container>
)

export default Checkbox
