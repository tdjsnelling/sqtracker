import React, { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toPath } from "lodash";
import qs from "qs";
import { CaretUp } from "@styled-icons/boxicons-regular/CaretUp";
import { CaretDown } from "@styled-icons/boxicons-regular/CaretDown";
import Box from "../components/Box";
import Text from "../components/Text";
import LocaleContext from "../utils/LocaleContext";

const getIn = (obj, key, p = 0) => {
  const path = toPath(key);
  while (obj && p < path.length) {
    obj = obj[path[p++]];
  }
  return obj;
};

const WrapLink = ({ href, target, children }) =>
  href ? (
    <Link href={href} passHref>
      <Text
        as="a"
        display="block"
        color="text"
        target={target}
        _css={{
          "&:visited": { color: "text" },
          "&:hover": { bg: "sidebar", textDecoration: "none" },
        }}
      >
        {children}
      </Text>
    </Link>
  ) : (
    children
  );

const ListItem = ({ children }) => {
  return (
    <Box
      as="li"
      borderBottom="1px solid"
      borderColor="border"
      _css={{
        "&:first-child": { borderTopWidth: "1px", borderTopStyle: "solid" },
      }}
    >
      {children}
    </Box>
  );
};

const getSortIcon = (accessor, sort = "") => {
  const [sortAccessor, sortDirection] = sort.split(":");
  if (accessor !== sortAccessor) return null;
  if (sortDirection === "asc") return CaretUp;
  if (sortDirection === "desc") return CaretDown;
  return null;
};

const List = ({ data = [], columns = [], ...rest }) => {
  const router = useRouter();
  const { sort } = router.query;

  const { getLocaleString } = useContext(LocaleContext);

  return (
    <Box overflowX="auto">
      <Box minWidth="700px">
        <Box
          display="grid"
          gridTemplateColumns={columns.map((col) => col.gridWidth).join(" ")}
          gridGap={[2, 4]}
          alignItems="center"
          px={4}
          mb={3}
        >
          {columns.map((col, i) => (
            <Text
              key={`list-header-col-${i}`}
              fontWeight={600}
              fontSize={1}
              textAlign={col.rightAlign ? "right" : "left"}
              _css={{
                textTransform: "uppercase",
                cursor: col.sortable ? "pointer" : "text",
                userSelect: col.sortable ? "none" : "auto",
              }}
              onClick={
                col.sortable
                  ? () => {
                      const query = window.location.search;
                      const parsed = qs.parse(query.replace("?", ""));
                      if (parsed.sort) {
                        const [accessor, direction] = parsed.sort.split(":");
                        if (accessor === col.accessor) {
                          if (direction === "asc")
                            parsed.sort = `${col.accessor}:desc`;
                          else if (direction === "desc") delete parsed.sort;
                        } else {
                          parsed.sort = `${col.accessor}:asc`;
                        }
                      } else {
                        parsed.sort = `${col.accessor}:asc`;
                      }
                      router.replace(
                        Object.keys(parsed).length
                          ? `${window.location.pathname}?${qs.stringify(
                              parsed
                            )}`
                          : window.location.pathname
                      );
                    }
                  : undefined
              }
              icon={getSortIcon(col.accessor, sort)}
              iconTextWrapperProps={{
                justifyContent: col.rightAlign ? "flex-end" : "flex-start",
              }}
            >
              {col.header}
            </Text>
          ))}
        </Box>
        <Box as="ul" pl={0} _css={{ listStyle: "none" }} {...rest}>
          {data.length ? (
            data.map((row, i) => (
              <ListItem key={`list-row-${i}`}>
                <WrapLink href={row.href} target={row.hrefTarget}>
                  <Box
                    display="grid"
                    gridTemplateColumns={columns
                      .map((col) => col.gridWidth)
                      .join(" ")}
                    gridGap={[2, 4]}
                    alignItems="center"
                    minHeight="50px"
                    px={4}
                  >
                    {columns.map((col, j) => (
                      <Box
                        key={`list-row-${i}-col-${j}`}
                        width="100%"
                        display="flex"
                        alignItems="center"
                        textAlign={col.rightAlign ? "right" : "left"}
                        _css={{
                          overflow: "hidden",
                          "> *": {
                            width: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      >
                        {col.cell({
                          value: col.accessor ? getIn(row, col.accessor) : null,
                          row,
                        })}
                      </Box>
                    ))}
                  </Box>
                </WrapLink>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <Box p={4}>
                <Text color="grey">{getLocaleString("listNoItemShow")}</Text>
              </Box>
            </ListItem>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default List;
