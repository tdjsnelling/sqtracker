import React from "react";
import Head from "next/head";
import getConfig from "next/config";

const SEO = ({ title, noTitleTemplate }) => {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME, SQ_SITE_DESCRIPTION },
  } = getConfig();

  const formattedTitle = title
    ? noTitleTemplate
      ? title
      : `${title} — ${SQ_SITE_NAME}`
    : SQ_SITE_NAME;

  return (
    <Head>
      <title>{formattedTitle}</title>
      <meta property="og:title" content={formattedTitle} />
      <meta name="description" content={SQ_SITE_DESCRIPTION} />
      <meta property="og:description" content={SQ_SITE_DESCRIPTION} />
      <meta property="og:site_name" content={SQ_SITE_NAME} />
      <meta property="og:type" content="website" />
    </Head>
  );
};

export default SEO;
