import React, { useContext, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Input from "./Input";
import Box from "./Box";
import Text from "./Text";
import Infobox from "./Infobox";
import MarkdownBody from "./MarkdownBody";
import LocaleContext from "../utils/LocaleContext";

const MarkdownInput = ({ defaultValue, mb, ...rest }) => {
  const [bodyValue, setBodyValue] = useState(defaultValue);

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <Box mb={mb}>
      <Input
        value={bodyValue}
        onChange={(e) => setBodyValue(e.target.value)}
        mb={3}
        {...rest}
      />
      <Box as="details">
        <Box as="summary">
          <Text
            as="span"
            fontWeight={600}
            fontSize={1}
            _css={{ textTransform: "uppercase" }}
          >
            {getLocaleString("mdMarkdownPreview")}
          </Text>
        </Box>
        <Infobox mt={3}>
          <MarkdownBody>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a({ href, ...props }) {
                  return href.startsWith("http") ? (
                    <a href={href} target="_blank" {...props} />
                  ) : (
                    <Link href={href} passHref>
                      <a {...props} />
                    </Link>
                  );
                },
              }}
            >
              {bodyValue}
            </ReactMarkdown>
          </MarkdownBody>
        </Infobox>
      </Box>
    </Box>
  );
};

export default MarkdownInput;
