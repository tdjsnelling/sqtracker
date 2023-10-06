import React, { useContext } from "react";
import getConfig from "next/config";
import Link from "next/link";
import jwt from "jsonwebtoken";
import moment from "moment";
import { Check } from "@styled-icons/boxicons-regular/Check";
import { X } from "@styled-icons/boxicons-regular/X";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import { withAuthServerSideProps } from "../../utils/withAuth";
import Button from "../../components/Button";
import List from "../../components/List";
import LocaleContext from "../../utils/LocaleContext";

const Requests = ({ requests }) => {
  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={getLocaleString("navRequests")} />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Text as="h1">{getLocaleString("navRequests")}</Text>
        <Link href="/requests/new" passHref>
          <a>
            <Button>{getLocaleString("reqCreateNew")}</Button>
          </a>
        </Link>
      </Box>
      <List
        data={requests.map((request) => ({
          ...request,
          href: `/requests/${request.index}`,
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
            gridWidth: "0.5fr",
          },
          {
            header: `${getLocaleString("reqFulfilled")}`,
            accessor: "fulfilledBy",
            cell: ({ value }) => (
              <Box color={value ? "success" : "grey"}>
                {value ? <Check size={24} /> : <X size={24} />}{" "}
              </Box>
            ),
            gridWidth: "100px",
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
      const requestsRes = await fetch(`${SQ_API_URL}/requests/page/0`, {
        headers: fetchHeaders,
      });
      if (
        requestsRes.status === 403 &&
        (await requestsRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const requests = await requestsRes.json();

      return {
        props: { requests, userRole: role || "user" },
      };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Requests;
