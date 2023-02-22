import React from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import moment from "moment";
import slugify from "slugify";
import { ListUl } from "@styled-icons/boxicons-regular/ListUl";
import { Upload } from "@styled-icons/boxicons-regular/Upload";
import { Download } from "@styled-icons/boxicons-regular/Download";
import { Chat } from "@styled-icons/boxicons-solid/Chat";
import { ChevronsLeft } from "@styled-icons/boxicons-solid/ChevronsLeft";
import { ChevronLeft } from "@styled-icons/boxicons-solid/ChevronLeft";
import { ChevronsRight } from "@styled-icons/boxicons-solid/ChevronsRight";
import { ChevronRight } from "@styled-icons/boxicons-solid/ChevronRight";
import List from "./List";
import Text from "./Text";
import Box from "./Box";
import Button from "./Button";

const TorrentList = ({ torrents = [], categories, total }) => {
  const {
    publicRuntimeConfig: { SQ_SITE_WIDE_FREELEECH },
  } = getConfig();

  const router = useRouter();
  const {
    asPath,
    query: { page: pageParam },
  } = router;

  const page = pageParam ? parseInt(pageParam) - 1 : 0;

  const maxPage = Math.floor(total / 25);
  const canPrevPage = page > 0;
  const canNextPage = page < maxPage;

  const setPage = (number) => {
    if (number === 0) router.push(asPath.split("?")[0]);
    else router.push(`${asPath.split("?")[0]}?page=${number + 1}`);
  };

  return (
    <>
      <List
        data={torrents.map((torrent) => ({
          ...torrent,
          href: `/torrent/${torrent.infoHash}`,
        }))}
        columns={[
          {
            header: "Name",
            accessor: "name",
            cell: ({ value, row }) => (
              <Text title={value}>
                {value}
                {(row.freeleech || SQ_SITE_WIDE_FREELEECH === true) && (
                  <Text as="span" fontSize={0} color="primary" ml={3}>
                    FL!
                  </Text>
                )}
              </Text>
            ),
            gridWidth: "2fr",
          },
          {
            header: "Category",
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
            gridWidth: "1fr",
          },
          {
            header: "Seeders",
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
          },
          {
            header: "Leechers",
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
          },
          {
            header: "Comments",
            accessor: "comments.count",
            cell: ({ value }) => (
              <Text
                icon={Chat}
                iconTextWrapperProps={{ justifyContent: "flex-end" }}
              >
                {value || 0}
              </Text>
            ),
            gridWidth: "100px",
            rightAlign: true,
          },
          {
            header: "Uploaded",
            accessor: "created",
            cell: ({ value }) => (
              <Text>{moment(value).format("Do MMM YYYY")}</Text>
            ),
            gridWidth: "140px",
            rightAlign: true,
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
            {total.toLocaleString()} results — Page {page + 1} of{" "}
            {(maxPage + 1).toLocaleString()}
          </Text>
        </Box>
      )}
    </>
  );
};

export default TorrentList;
