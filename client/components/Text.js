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
  ({ _css }) =>
    styledCss({
      ..._css,
    })
)

const Text = ({
  children,
  fref,
  icon: Icon,
  iconSize = 20,
  iconColor = 'grey',
  my,
  mt,
  mb,
  mx,
  ml,
  mr,
  iconTextWrapperProps,
  iconWrapperProps,
  ...rest
}) =>
  Icon ? (
    <Box
      display="inline-flex"
      alignItems="center"
      my={my}
      mt={mt}
      mb={mb}
      mx={mx}
      ml={ml}
      mr={mr}
      {...iconTextWrapperProps}
    >
      <Box
        display="flex"
        alignItems="center"
        color={iconColor}
        mr={2}
        {...iconWrapperProps}
      >
        <Icon size={iconSize} />
      </Box>
      <StyledText ref={fref} lineHeight={1.25} {...rest}>
        {children}
      </StyledText>
    </Box>
  ) : (
    <StyledText
      ref={fref}
      my={my}
      mt={mt}
      mb={mb}
      mx={mx}
      ml={ml}
      mr={mr}
      {...rest}
    >
      {children}
    </StyledText>
  )

export default React.forwardRef((props, ref) => <Text fref={ref} {...props} />)
