import React, { useContext } from "react";
import getConfig from "next/config";
import jwt from "jsonwebtoken";
import styled from "styled-components";
import css from "@styled-system/css";
import SEO from "../components/SEO";
import Text from "../components/Text";
import { withAuthServerSideProps } from "../utils/withAuth";
import LocaleContext from "../utils/LocaleContext";

const StyledTable = styled.table(() =>
  css({
    borderCollapse: "collapse",
    "&, td": {
      border: "1px solid",
      borderColor: "border",
    },
    td: {
      px: 4,
      py: 3,
    },
  })
);

const Stats = ({ stats, userRole }) => {
  const { getLocaleString } = useContext(LocaleContext);
  if (userRole !== "admin") {
    return <Text>{getLocaleString("statYouNotPermission")}</Text>;
  }

  console.log(stats);

  return (
    <>
      <SEO title={getLocaleString("statTrackerStat")} />
      <Text as="h1" mb={5}>
        {getLocaleString("statTrackerStat")}
      </Text>
      <StyledTable>
        {Object.entries(stats).map(([key, value]) => {
          const localeKey = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <tr key={`stat-${key}`}>
              <td>{getLocaleString(`stat${localeKey}`)}</td>
              <td>{value}</td>
            </tr>
          );
        })}
      </StyledTable>
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
      const statsRes = await fetch(`${SQ_API_URL}/admin/stats`, {
        headers: fetchHeaders,
      });
      if (
        statsRes.status === 403 &&
        (await statsRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const stats = await statsRes.json();
      return { props: { stats, userRole: role } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Stats;
