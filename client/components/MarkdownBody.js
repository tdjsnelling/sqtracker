import styled from "styled-components";
import css from "@styled-system/css";

const Body = styled.div(() =>
  css({
    color: "text",
    wordBreak: "break-word",
    fontSize: 2,
    "> * + *": {
      mt: 3,
    },
    "li > * + *": {
      mt: 3,
    },
    "h1, h2": {
      fontSize: 4,
    },
    "* + h1, * + h2, * + h3, * + h4, * + h5, * + h6": {
      mt: 4,
    },
    a: {
      wordBreak: "break-word",
    },
    "ul, ol": {
      ml: "20px",
    },
    blockquote: {
      borderLeft: "2px solid",
      borderColor: "primary",
      pl: 4,
    },
    img: {
      borderRadius: 1,
      my: 4,
      maxWidth: "100%",
      height: "auto",
      border: "1px solid",
      borderColor: "border",
    },
    video: {
      my: 4,
      borderRadius: 1,
      overflow: "hidden",
      fontSize: 0,
      border: "1px solid ",
      borderColor: "border",
    },
    hr: {
      border: 0,
      height: "1px",
      bg: "border",
    },
    table: {
      my: 4,
      width: "100%",
      bg: "transparent",
      thead: {
        bg: "sidebar",
        tr: {
          fontFamily: "body",
          fontWeight: "bold",
          textAlign: "left",
          lineHeight: 1.4,
        },
      },
    },
    "table, th, td": {
      border: "1px solid",
      borderColor: "border",
      borderCollapse: "collapse",
    },
    "th, td": {
      px: 4,
      py: 3,
      wordBreak: "normal",
    },
  })
);

export default Body;
