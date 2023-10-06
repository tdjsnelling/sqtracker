import React, { useContext } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import moment from "moment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import Button from "../../components/Button";
import MarkdownBody from "../../components/MarkdownBody";
import { Info } from "../torrent/[infoHash]";
import { withAuthServerSideProps } from "../../utils/withAuth";
import { NotificationContext } from "../../components/Notifications";
import LoadingContext from "../../utils/LoadingContext";
import LocaleContext from "../../utils/LocaleContext";

const Report = ({ report, token, userRole }) => {
  const { addNotification } = useContext(NotificationContext);
  const { setLoading } = useContext(LoadingContext);

  const {
    publicRuntimeConfig: { SQ_API_URL },
  } = getConfig();

  const router = useRouter();

  const { getLocaleString } = useContext(LocaleContext);

  const handleResolve = async () => {
    setLoading(true);

    try {
      const resolveRes = await fetch(
        `${SQ_API_URL}/reports/resolve/${report._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resolveRes.status !== 200) {
        const reason = await resolveRes.text();
        throw new Error(reason);
      }

      addNotification("success", `${getLocaleString("repRepMarkSolved")}`);

      router.push("/reports");
    } catch (e) {
      addNotification(
        "error",
        `${getLocaleString("repCouldNotResolveRep")}: ${e.message}`
      );
      console.error(e);
    }

    setLoading(false);
  };

  if (userRole !== "admin") {
    return <Text>{getLocaleString("statYouNotPermission")}</Text>;
  }

  return (
    <>
      <SEO
        title={`${getLocaleString("repRepOn")} “${
          report.torrent.name
        }” | ${getLocaleString("navReports")}`}
      />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Text as="h1">
          {getLocaleString("repRepOn")} “{report.torrent.name}”
        </Text>
        <Button onClick={handleResolve}>
          {getLocaleString("repMarkSolved")}
        </Button>
      </Box>
      <Text color="grey" mb={5}>
        {getLocaleString("repRep")}{" "}
        {moment(report.created).format(`${getLocaleString("indexTime")}`)}{" "}
        {getLocaleString("reqBy")}{" "}
        <Link href={`/user/${report.reportedBy.username}`} passHref>
          <a>{report.reportedBy.username}</a>
        </Link>
      </Text>
      <Info
        title={getLocaleString("repTorrDetail")}
        items={{
          [getLocaleString("uploadName")]: (
            <Link href={`/torrent/${report.torrent.infoHash}`} passHref>
              <a>{report.torrent.name}</a>
            </Link>
          ),
          [getLocaleString("uploadDescription")]: report.torrent.description,
          [getLocaleString("reqInfohash")]: (
            <Text
              as="span"
              fontFamily="mono"
              _css={{ userSelect: "all", wordBreak: "break-all" }}
            >
              {report.torrent.infoHash}
            </Text>
          ),
          [getLocaleString("accCreated")]: moment(
            report.torrent.created
          ).format(`${getLocaleString("indexTime")}`),
        }}
      />
      <Text
        fontWeight={600}
        fontSize={1}
        _css={{ textTransform: "uppercase" }}
        mb={4}
      >
        {getLocaleString("torrReasonForReport")}
      </Text>
      <MarkdownBody>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.reason}
        </ReactMarkdown>
      </MarkdownBody>
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, query: { id } }) => {
    if (!token) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
      serverRuntimeConfig: { SQ_JWT_SECRET },
    } = getConfig();

    const { role } = jwt.verify(token, SQ_JWT_SECRET);

    if (role !== "admin") return { props: { report: null, userRole: role } };

    try {
      const reportRes = await fetch(`${SQ_API_URL}/reports/${id}`, {
        headers: fetchHeaders,
      });
      if (
        reportRes.status === 403 &&
        (await reportRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const report = await reportRes.json();
      return { props: { report, token, userRole: role } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  }
);

export default Report;
