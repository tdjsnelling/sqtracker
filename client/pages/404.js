import React from "react";
import Link from "next/link";
import SEO from "../components/SEO";
import Text from "../components/Text";

const NotFound = () => (
  <>
    <SEO title="Not found" />
    <Text as="h1" mb={5}>
      404: Not found
    </Text>
    <Text>
      That page does not exist.{" "}
      <Link href="/" passHref>
        <a>Return home</a>
      </Link>
      .
    </Text>
  </>
);

export default NotFound;
