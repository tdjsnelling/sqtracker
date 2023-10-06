import React, { useContext } from "react";
import Link from "next/link";
import moment from "moment";
import { Comment as CommentIcon } from "@styled-icons/boxicons-regular/Comment";
import { File } from "@styled-icons/boxicons-regular/File";
import { News } from "@styled-icons/boxicons-regular/News";
import { CommentAdd } from "@styled-icons/boxicons-regular/CommentAdd";
import Box from "./Box";
import Text from "./Text";
import LocaleContext from "../utils/LocaleContext";

const Comment = ({ comment }) => {
  const { getLocaleString } = useContext(LocaleContext);

  return (
    <Box
      p={4}
      borderTop="1px solid"
      borderColor="border"
      _css={{
        "&:last-child": {
          borderBottom: "1px solid",
          borderBottomColor: "border",
        },
      }}
    >
      <Box
        display="flex"
        flexDirection={["column", "row"]}
        alignItems={["flex-start", "center"]}
        justifyContent="space-between"
        mb={3}
      >
        {comment.user?.username ? (
          <Text color="grey" icon={CommentIcon} mb={[2, 0]}>
            {getLocaleString("comCommentBy")}{" "}
            <Link href={`/user/${comment.user.username}`} passHref>
              <Text as="a">{comment.user.username}</Text>
            </Link>{" "}
            {getLocaleString("comOn")}{" "}
            {comment.type === "torrent" && (
              <>
                {comment.torrent ? (
                  <Link href={`/torrent/${comment.torrent.infoHash}`} passHref>
                    <Text
                      as="a"
                      icon={File}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: "text-bottom" },
                      }}
                    >
                      {comment.torrent.name}
                    </Text>
                  </Link>
                ) : (
                  "deleted torrent"
                )}
              </>
            )}
            {comment.type === "announcement" && (
              <>
                {comment.announcement ? (
                  <Link
                    href={`/announcements/${comment.announcement.slug}`}
                    passHref
                  >
                    <Text
                      as="a"
                      icon={News}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: "text-bottom" },
                      }}
                    >
                      {comment.announcement.title}
                    </Text>
                  </Link>
                ) : (
                  "deleted announcement"
                )}
              </>
            )}
            {comment.type === "request" && (
              <>
                {comment.request ? (
                  <Link href={`/requests/${comment.request.index}`} passHref>
                    <Text
                      as="a"
                      icon={CommentAdd}
                      iconColor="primary"
                      iconTextWrapperProps={{
                        style: { verticalAlign: "text-bottom" },
                      }}
                    >
                      {comment.request.title}
                    </Text>
                  </Link>
                ) : (
                  "deleted request"
                )}
              </>
            )}
          </Text>
        ) : (
          <Text>
            {getLocaleString("comCommentBy")}{" "}
            <Text as="span" color="grey">
              {getLocaleString("comDelUser")}
            </Text>
          </Text>
        )}
        <Text color="grey" textAlign="right">
          {getLocaleString("reqPosted")}{" "}
          {moment(comment.created).format(`${getLocaleString("indexTime")}`)}
        </Text>
      </Box>
      <Text>{comment.comment}</Text>
    </Box>
  );
};

export default Comment;
