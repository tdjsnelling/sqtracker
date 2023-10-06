import React, { useContext, useEffect } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import moment from "moment";
import slugify from "slugify";
import qs from "qs";
import { ListUl } from "@styled-icons/boxicons-regular/ListUl";
import { Upload } from "@styled-icons/boxicons-regular/Upload";
import { Download } from "@styled-icons/boxicons-regular/Download";
import { File } from "@styled-icons/boxicons-regular/File";
import { Chat } from "@styled-icons/boxicons-solid/Chat";
import { ChevronsLeft } from "@styled-icons/boxicons-solid/ChevronsLeft";
import { ChevronLeft } from "@styled-icons/boxicons-solid/ChevronLeft";
import { ChevronsRight } from "@styled-icons/boxicons-solid/ChevronsRight";
import { ChevronRight } from "@styled-icons/boxicons-solid/ChevronRight";
import { Bookmark } from "@styled-icons/boxicons-solid/Bookmark";
import List from "./List";
import Text from "./Text";
import Box from "./Box";
import Button from "./Button";
import LocaleContext from "../utils/LocaleContext";

const pageSize = 25;

const TorrentList = ({
  torrents = [],
  setTorrents,
  categories,
  total,
  fetchPath,
  token,
}) => {
  const {
    publicRuntimeConfig: { SQ_SITE_WIDE_FREELEECH },
  } = getConfig();

  const router = useRouter();
  const {
    query: { page: pageParam, sort },
  } = router;

  const page = pageParam ? parseInt(pageParam) - 1 : 0;

  const maxPage = total > pageSize ? Math.floor(total / pageSize) : 0;
  const canPrevPage = page > 0;
  const canNextPage = page < maxPage;

  const setPage = (number) => {
    const query = qs.parse(window.location.search.replace("?", ""));
    if (number === 0) delete query.page;
    else query.page = number + 1;
    router.push(
      Object.keys(query).length
        ? `${window.location.pathname}?${qs.stringify(query)}`
        : window.location.pathname
    );
  };

  useEffect(() => {
    const fetchTorrents = async () => {
      try {
        const searchRes = await fetch(
          `${fetchPath}?${qs.stringify(router.query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const results = await searchRes.json();
        setTorrents(results.torrents);
      } catch (e) {}
    };
    if (fetchPath && token) fetchTorrents();
  }, [sort, page]);

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <List
        data={torrents.map((torrent) => ({
          ...torrent,
          href: `/torrent/${torrent.infoHash}`,
        }))}
        columns={[
          {
            header: `${getLocaleString("uploadName")}`,
            accessor: "name",
            cell: ({ value, row }) => (
              <Text title={value}>
                {value}
                {row.fetchedBy?.bookmarked && (
                  <Box as={Bookmark} size={16} color="primary" ml={2} />
                )}
                {(row.freeleech || SQ_SITE_WIDE_FREELEECH === true) && (
                  <Text as="span" fontSize={0} color="primary" ml={3}>
                    {getLocaleString("torrFL")}
                  </Text>
                )}
              </Text>
            ),
            gridWidth: "minmax(150px, 2fr)",
          },
          {
            header: `${getLocaleString("uploadCategory")}`,
            accessor: "type",
            cell: ({ value }) => {
              const category =
                Object.keys(categories).find(
                  (c) => slugify(c, { lower: true }) === value
                ) || "None";
              return (
                <Text icon={ListUl} title={category}>
                  {category}
                </Text>
              );
            },
            gridWidth: "minmax(75px, 1fr)",
          },
          {
            header: `${getLocaleString("torrSeeders")}`,
            accessor: "seeders",
            cell: ({ value }) => (
              <Text
                icon={Upload}
                iconTextWrapperProps={{ justifyContent: "flex-end" }}
              >
                {value !== undefined ? value : "?"}
              </Text>
            ),
            gridWidth: "100px",
            rightAlign: true,
            sortable: !!token,
          },
          {
            header: `${getLocaleString("torrLeechers")}`,
            accessor: "leechers",
            cell: ({ value }) => (
              <Text
                icon={Download}
                iconTextWrapperProps={{ justifyContent: "flex-end" }}
              >
                {value !== undefined ? value : "?"}
              </Text>
            ),
            gridWidth: "100px",
            rightAlign: true,
            sortable: !!token,
          },
          {
            header: `${getLocaleString("torrDownloads")}`,
            accessor: "downloads",
            cell: ({ value }) => (
              <Text
                icon={File}
                iconTextWrapperProps={{ justifyContent: "flex-end" }}
              >
                {value || 0}
              </Text>
            ),
            gridWidth: "115px",
            rightAlign: true,
            sortable: !!token,
          },
          {
            header: `${getLocaleString("userComments")}`,
            accessor: "comments.count",
            cell: ({ value }) => (
              <Text
                icon={Chat}
                iconTextWrapperProps={{ justifyContent: "flex-end" }}
              >
                {value || 0}
              </Text>
            ),
            gridWidth: "110px",
            rightAlign: true,
            sortable: !!token,
          },
          {
            header: `${getLocaleString("torrUploaded")}`,
            accessor: "created",
            cell: ({ value }) => (
              <Text>
                {moment(value).format(
                  `${getLocaleString("userUserSinceTime")}`
                )}
              </Text>
            ),
            gridWidth: "140px",
            rightAlign: true,
            sortable: !!token,
          },
        ]}
      />
      {typeof total === "number" && (
        <Box display="flex" alignItems="center" mt={4}>
          <Button
            onClick={() => setPage(0)}
            variant="secondary"
            disabled={!canPrevPage}
            px={1}
            py={1}
            mr={2}
          >
            <ChevronsLeft size={24} />
          </Button>
          <Button
            onClick={() => setPage(page - 1)}
            variant="secondary"
            disabled={!canPrevPage}
            px={1}
            py={1}
            mr={2}
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            onClick={() => setPage(page + 1)}
            variant="secondary"
            disabled={!canNextPage}
            px={1}
            py={1}
            mr={2}
          >
            <ChevronRight size={24} />
          </Button>
          <Button
            onClick={() => setPage(maxPage)}
            variant="secondary"
            disabled={!canNextPage}
            px={1}
            py={1}
            mr={3}
          >
            <ChevronsRight size={24} />
          </Button>
          <Text color="grey">
            {total.toLocaleString()} {getLocaleString("torrResults")} —{" "}
            {getLocaleString("torrPage")} {page + 1} {getLocaleString("torrOf")}{" "}
            {(maxPage + 1).toLocaleString()}
          </Text>
        </Box>
      )}
    </>
  );
};

export default TorrentList;
