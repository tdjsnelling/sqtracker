import React from 'react'
import styled from 'styled-components'
import { layout, space, typography } from 'styled-system'
import css from '@styled-system/css'
import Box from './Box'
import Text from './Text'

const shared = () =>
  css({
    appearance: 'none',
    display: 'block',
    width: '100%',
    bg: 'sidebar',
    border: '2px solid',
    borderColor: 'sidebar',
    borderRadius: 1,
    fontFamily: 'body',
    fontSize: 2,
    px: 4,
    py: 3,
    '&:focus': {
      borderColor: 'primary',
      outline: 0,
    },
  })

const StyledInput = styled.input(shared, layout, space, typography)

const StyledTextarea = styled.textarea(shared, layout, space, typography)

export const WrapLabel = ({ label, children, as = 'label', ...rest }) =>
  label ? (
    <Box as={as} display="block" {...rest}>
      <Text
        fontWeight={600}
        fontSize={1}
        mb={3}
        css={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      {children}
    </Box>
  ) : (
    children
  )

const Input = ({ label, rows, my, mt, mb, ...rest }) => {
  return (
    <WrapLabel label={label} my={my} mt={mt} mb={mb}>
      {rows ? <StyledTextarea rows={rows} /> : <StyledInput {...rest} />}
    </WrapLabel>
  )
}

export default Input
