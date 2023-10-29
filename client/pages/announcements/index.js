import React, { useContext } from "react";
import getConfig from "next/config";
import Link from "next/link";
import jwt from "jsonwebtoken";
import moment from "moment";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import { withAuthServerSideProps } from "../../utils/withAuth";
import Button from "../../components/Button";
import List from "../../components/List";
import LocaleContext from "../../utils/LocaleContext";

const Announcements = ({ announcements, pinnedAnnouncements, userRole }) => {
  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={getLocaleString("navAnnouncements")} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1">{getLocaleString("navAnnouncements")}</Text>
        {userRole === "admin" && (
          <Link href="/announcements/new" passHref>
            <a>
              <Button>{getLocaleString("reqCreateNew")}</Button>
            </a>
          </Link>
        )}
      </Box>
      {!!pinnedAnnouncements.length && (
        <>
          <Box mb={5}>
            <Text as="h3" mb={4}>
              {getLocaleString("annPinnedAnnounce")}
            </Text>
            <List
              data={pinnedAnnouncements.map((announcement) => ({
                ...announcement,
                href: `/announcements/${announcement.slug}`,
              }))}
              columns={[
                {
                  header: `${getLocaleString("reqTitle")}`,
                  accessor: "title",
                  cell: ({ value }) => <Text>{value}</Text>,
                  gridWidth: "1fr",
                },
                {
                  header: `${getLocaleString("reqPostedBy")}`,
                  accessor: "createdBy.username",
                  cell: ({ value }) => <Text>{value ?? "deleted user"}</Text>,
                  gridWidth: "1fr",
                },
                {
                  header: `${getLocaleString("accCreated")}`,
                  accessor: "created",
                  cell: ({ value }) => (
                    <Text>
                      {moment(value).format(`${getLocaleString("indexTime")}`)}
                    </Text>
                  ),
                  rightAlign: true,
                  gridWidth: "175px",
                },
              ]}
            />
          </Box>
          <Text as="h3" mb={4}>
            {getLocaleString("annOtherAnnounce")}
          </Text>
        </>
      )}
      <List
        data={announcements.map((announcement) => ({
          ...announcement,
          href: `/announcements/${announcement.slug}`,
        }))}
        columns={[
          {
            header: `${getLocaleString("reqTitle")}`,
            accessor: "title",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: `${getLocaleString("reqPostedBy")}`,
            accessor: "createdBy.username",
            cell: ({ value }) => <Text>{value ?? "deleted user"}</Text>,
            gridWidth: "1fr",
          },
          {
            header: `${getLocaleString("accCreated")}`,
            accessor: "created",
            cell: ({ value }) => (
              <Text>
                {moment(value).format(`${getLocaleString("indexTime")}`)}
              </Text>
            ),
            rightAlign: true,
            gridWidth: "175px",
          },
        ]}
      />
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { role } = jwt.verify(token, SQ_JWT_SECRET);

    try {
      const announcementsRes = await fetch(
        `${SQ_API_URL}/announcements/page/0`,
        {
          headers: fetchHeaders,
        }
      );
      if (
        announcementsRes.status === 403 &&
        (await announcementsRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const announcements = await announcementsRes.json();

      const pinnedAnnouncementsRes = await fetch(
        `${SQ_API_URL}/announcements/pinned`,
        {
          headers: fetchHeaders,
        }
      );
      const pinnedAnnouncements = await pinnedAnnouncementsRes.json();

      return {
        props: { announcements, pinnedAnnouncements, userRole: role || "user" },
      };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Announcements;
