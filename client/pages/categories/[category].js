import React, { useContext, useState } from "react";
import { useRouter } from "next/router";
import getConfig from "next/config";
import qs from "qs";
import slugify from "slugify";
import { withAuthServerSideProps } from "../../utils/withAuth";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import TorrentList from "../../components/TorrentList";
import LocaleContext from "../../utils/LocaleContext";

const Category = ({ results, token }) => {
  const [torrents, setTorrents] = useState(results?.torrents ?? []);

  const router = useRouter();
  const {
    query: { category: categorySlug },
  } = router;

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES, SQ_API_URL },
  } = getConfig();

  const category = Object.keys(SQ_TORRENT_CATEGORIES).find(
    (c) => slugify(c, { lower: true }) === categorySlug
  );

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={`${getLocaleString("navBrowse")}  ${category}`} />
      <Text as="h1" mb={5}>
        {getLocaleString("navBrowse")} {category}
      </Text>
      {torrents.length ? (
        <TorrentList
          torrents={torrents}
          setTorrents={setTorrents}
          categories={SQ_TORRENT_CATEGORIES}
          total={results.total}
          fetchPath={`${SQ_API_URL}/torrent/search`}
          token={token}
        />
      ) : (
        <Text color="grey">{getLocaleString("catNoResults")}</Text>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({
    token,
    fetchHeaders,
    isPublicAccess,
    query: { category, source, page: pageParam },
  }) => {
    if (!token && !isPublicAccess) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig();

    const params = {
      category: encodeURIComponent(category),
      source: source ? encodeURIComponent(source) : undefined,
    };
    const page = pageParam ? parseInt(pageParam) : 0;
    if (page > 0) params.page = page;

    try {
      const searchRes = await fetch(
        `${SQ_API_URL}/torrent/search?${qs.stringify(params)}`,
        {
          headers: fetchHeaders,
        }
      );
      if (
        searchRes.status === 403 &&
        (await searchRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const results = await searchRes.json();
      return { props: { results, token } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  },
  true
);

export default Category;
