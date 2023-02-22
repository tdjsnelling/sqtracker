import styled from "styled-components";
import {
  space,
  layout,
  flexbox,
  background,
  color,
  grid,
  typography,
  border,
  shadow,
  position,
} from "styled-system";
import styledCss from "@styled-system/css";

const Box = styled.div(
  space,
  layout,
  grid,
  background,
  color,
  flexbox,
  typography,
  border,
  position,
  shadow,
  ({ _css }) => styledCss({ ..._css })
);

export default Box;
