import React from "react";
import { useRouter } from "next/router";
import getConfig from "next/config";
import qs from "qs";
import { withAuthServerSideProps } from "../../utils/withAuth";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import TorrentList from "../../components/TorrentList";

const Tag = ({ results }) => {
  const router = useRouter();
  const {
    query: { tag },
  } = router;

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig();

  return (
    <>
      <SEO title={`Tagged with “${tag}”`} />
      <Text as="h1" mb={5}>
        Tagged with “{tag}”
      </Text>
      {results?.torrents.length ? (
        <TorrentList
          torrents={results.torrents}
          categories={SQ_TORRENT_CATEGORIES}
          total={results.total}
        />
      ) : (
        <Text color="grey">No results.</Text>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { tag, page: pageParam } }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig();

    const params = {
      tag: encodeURIComponent(tag),
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
      return { props: { results } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Tag;
