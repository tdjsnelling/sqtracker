import React from "react";
import getConfig from "next/config";
import jwt from "jsonwebtoken";
import moment from "moment";
import SEO from "../../components/SEO";
import Text from "../../components/Text";
import { withAuthServerSideProps } from "../../utils/withAuth";
import List from "../../components/List";

const Reports = ({ reports, userRole }) => {
  if (userRole !== "admin") {
    return <Text>You do not have permission to do that.</Text>;
  }

  return (
    <>
      <SEO title="Unresolved reports" />
      <Text as="h1" mb={5}>
        Unresolved reports
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
            header: "Torrent",
            accessor: "torrent.name",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: "Reported by",
            accessor: "reportedBy.username",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: "Reason",
            accessor: "reason",
            cell: ({ value }) => <Text>{value}</Text>,
            gridWidth: "1fr",
          },
          {
            header: "Created",
            accessor: "created",
            cell: ({ value }) => (
              <Text>{moment(value).format("HH:mm Do MMM YYYY")}</Text>
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
