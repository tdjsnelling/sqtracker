import React, { useState, useEffect } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import qs from "qs";
import { withAuthServerSideProps } from "../../utils/withAuth";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Box from "../../components/Box";
import TorrentList from "../../components/TorrentList";

const Search = ({ results, error, token }) => {
  const [torrents, setTorrents] = useState([]);

  useEffect(() => {
    setTorrents(results?.torrents ?? []);
  }, [results?.total]);

  const router = useRouter();
  let {
    query: { query },
  } = router;
  query = query ? decodeURIComponent(query) : "";

  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES, SQ_API_URL },
  } = getConfig();

  const handleSearch = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const query = form.get("query");
    if (query) router.push(`/search/${encodeURIComponent(query)}`);
  };

  return (
    <>
      <SEO title={query ? `Search results for “${query}”` : "Search"} />
      <Text as="h1" mb={5}>
        {query ? `Search results for “${query}”` : "Search"}
      </Text>
      <Box as="form" onSubmit={handleSearch} display="flex" mb={5}>
        <Input name="query" mr={3} required />
        <Button>Search</Button>
      </Box>
      {error ? (
        <Text color="error">Search error: {error}</Text>
      ) : (
        <>
          {query && (
            <>
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
                <Text color="grey">No results.</Text>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { query, page: pageParam } }) => {
    if (!token || !query) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig();

    const params = {
      query: encodeURIComponent(query),
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
      } else if (searchRes.status === 500) {
        const message = await searchRes.text();
        return { props: { error: message } };
      } else {
        const results = await searchRes.json();
        return { props: { results, token } };
      }
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: { results: { torrents: [] } } };
    }
  }
);

export default Search;
