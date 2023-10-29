import React, { useContext } from "react";
import getConfig from "next/config";
import jwt from "jsonwebtoken";
import moment from "moment";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import { withAuthServerSideProps } from "../../utils/withAuth";
import List from "../../components/List";
import LocaleContext from "../../utils/LocaleContext";

const Reports = ({ reports, userRole }) => {
  const { getLocaleString } = useContext(LocaleContext);

  if (userRole !== "admin") {
    return <Text>{getLocaleString("statYouNotPermission")}</Text>;
  }

  return (
    <>
      <SEO title={getLocaleString("repUnresolvedRep")} />
      <Text as="h1" mb={5}>
        {getLocaleString("repUnresolvedRep")}
      </Text>
      <List
        data={reports
          .filter((report) => !!report.torrent?.name)
          .map((report) => ({
            ...report,
            href: `/reports/${report._id}`,
          }))}
        columns={[
          {
            header: `${getLocaleString("torrTorrent")}`,
            accessor: "torrent.name",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: `${getLocaleString("repRepBy")}`,
            accessor: "reportedBy.username",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: `${getLocaleString("repReason")}`,
            accessor: "reason",
            cell: ({ value }) => <Text>{value}</Text>,
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

    if (role !== "admin") return { props: { reports: [], userRole: role } };

    try {
      const reportsRes = await fetch(`${SQ_API_URL}/reports/page/0`, {
        headers: fetchHeaders,
      });
      if (
        reportsRes.status === 403 &&
        (await reportsRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const reports = await reportsRes.json();
      return { props: { reports, userRole: role } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Reports;
