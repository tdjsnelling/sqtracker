import React, { useState, useEffect } from "react";
import Link from "next/link";
import getConfig from "next/config";
import NextErrorComponent from "next/error";
import * as Sentry from "@sentry/nextjs";
import SEO from "../components/SEO";
import Text from "../components/Text";

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

  return (
    <>
      <SEO title="Not found" />
      <Text as="h1" mb={5}>
        Something went wrong :(
      </Text>
      {rateLimited ? (
        <Text>
          Too many requests! You have been rate limited. Please wait a while
          before trying again.
        </Text>
      ) : (
        <Text>
          If the error persists, please{" "}
          <a
            href="https://github.com/tdjsnelling/sqtracker/issues"
            target="_blank"
            rel="noreferrer"
          >
            report it
          </a>
          . For now,{" "}
          <Link href="/" passHref>
            <a>return home</a>
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
