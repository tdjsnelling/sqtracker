import React from "react";
import styled from "styled-components";
import {
  space,
  background,
  color,
  flexbox,
  typography,
  border,
  position,
  layout,
} from "styled-system";
import styledCss from "@styled-system/css";
import Box from "./Box";

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
);

const Text = ({
  children,
  fref,
  icon: Icon,
  iconSize = 20,
  iconColor = "grey",
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
      alignItems="flex-start"
      verticalAlign="bottom"
      my={my}
      mt={mt}
      mb={mb}
      mx={mx}
      ml={ml}
      mr={mr}
      {...iconTextWrapperProps}
    >
      <Box
        color={iconColor}
        width={`${iconSize}px`}
        height={`${iconSize}px`}
        flexShrink={0}
        mr={2}
        position="relative"
        _css={{
          svg: {
            position: "absolute",
            top: 0,
            left: 0,
          },
        }}
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
  );

export default React.forwardRef((props, ref) => <Text fref={ref} {...props} />);
