import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import getConfig from "next/config";
import NextErrorComponent from "next/error";
import * as Sentry from "@sentry/nextjs";
import SEO from "../components/SEO";
import Text from "../components/Text";
import LocaleContext from "../utils/LocaleContext";

const ErrorPage = () => {
  const [rateLimited, setRateLimited] = useState(false);

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  useEffect(() => {
    const checkRateLimit = async () => {
      try {
        const res = await fetch(SQ_API_URL);
        if (res.status === 429) setRateLimited(true);
      } catch (e) {}
    };
    checkRateLimit();
  }, []);

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={getLocaleString("404NotFound")} />
      <Text as="h1" mb={5}>
        {getLocaleString("errSomethingWentWrong")} :(
      </Text>
      {rateLimited ? (
        <Text>{getLocaleString("errTooManyRequests")}</Text>
      ) : (
        <Text>
          {getLocaleString("errIfErrorPersist")}{" "}
          <a
            href="https://github.com/tdjsnelling/sqtracker/issues"
            target="_blank"
            rel="noreferrer"
          >
            {getLocaleString("errReportIt")}
          </a>
          . For now,{" "}
          <Link href="/" passHref>
            <a>{getLocaleString("404ReturnHome")}</a>
          </Link>
          .
        </Text>
      )}
    </>
  );
};

ErrorPage.getInitialProps = async (contextData) => {
  await Sentry.captureUnderscoreErrorException(contextData);
  return NextErrorComponent.getInitialProps(contextData);
};

export default ErrorPage;
