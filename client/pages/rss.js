import React, { useContext } from "react";
import getConfig from "next/config";
import SEO from "../components/SEO";
import Text from "../components/Text";
import LocaleContext from "../utils/LocaleContext";

const Rss = () => {
  const {
    publicRuntimeConfig: { SQ_BASE_URL },
  } = getConfig();

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={getLocaleString("navRSS")} />
      <Text as="h1" mb={4}>
        {getLocaleString("navRSS")}
      </Text>
      <Text mb={4}>
        {getLocaleString("rssThereRSSFeedAt")}{" "}
        <strong>{SQ_BASE_URL}/api/rss</strong>.
      </Text>
      <Text mb={4}>
        {getLocaleString("rssToAuthenticateYourself")}{" "}
        <strong>{getLocaleString("username")}</strong>{" "}
        {getLocaleString("rssAnd")}{" "}
        <strong>{getLocaleString("password")}</strong>{" "}
        {getLocaleString("rssToRSSEndpoint")}
      </Text>
      <Text mb={4}>{getLocaleString("rssNoQueryParametersAreProvided")}</Text>
      <Text>
        {getLocaleString("rssOnlyIncludeMatchingResults")}{" "}
        <strong>query</strong> {getLocaleString("rssQueryParameter")}{" "}
        <strong>/api/rss?query=loremipsum</strong>.
      </Text>
    </>
  );
};

export default Rss;
