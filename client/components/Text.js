import React from 'react'
import styled from 'styled-components'
import {
  space,
  background,
  color,
  flexbox,
  typography,
  border,
  position,
  layout,
} from 'styled-system'
import styledCss from '@styled-system/css'
import Box from './Box'

const StyledText = styled.p(
  space,
  layout,
  background,
  flexbox,
  color,
  typography,
  border,
  position,
  ({ css }) =>
    styledCss({
      ...css,
    })
)

const Text = ({
  children,
  icon: Icon,
  iconSize = 20,
  iconColor = 'grey',
  ...rest
}) =>
  Icon ? (
    <Box display="flex" alignItems="center">
      <Box display="flex" alignItems="center" color={iconColor} mr={3}>
        <Icon size={iconSize} />
      </Box>
      <StyledText {...rest}>{children}</StyledText>
    </Box>
  ) : (
    <StyledText {...rest}>{children}</StyledText>
  )

export default Text
