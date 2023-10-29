import React, { useContext } from "react";
import getConfig from "next/config";
import Link from "next/link";
import styled from "styled-components";
import css from "@styled-system/css";
import slugify from "slugify";
import { withAuth, withAuthServerSideProps } from "../../utils/withAuth";
import SEO from "../../components/SEO";
import Box from "../../components/Box";
import Text from "../../components/Text";
import LocaleContext from "../../utils/LocaleContext";
import qs from "qs";

const CategoryItem = styled.li(() =>
  css({
    bg: "sidebar",
    height: "150px",
    borderRadius: 2,
    a: {
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 3,
    },
  })
);

const Categories = ({ tags }) => {
  const {
    publicRuntimeConfig: { SQ_TORRENT_CATEGORIES },
  } = getConfig();
  const { getLocaleString } = useContext(LocaleContext);

  return (
    <>
      <SEO title={getLocaleString("catCategories")} />
      <Text as="h1" mb={5}>
        {getLocaleString("catCategories")}
      </Text>
      <Box mb={5}>
        {Object.keys(SQ_TORRENT_CATEGORIES).length ? (
          <Box
            as="ul"
            display="grid"
            gridTemplateColumns={["1fr", "repeat(4, 1fr)"]}
            gridGap={4}
            _css={{ pl: 0, listStyle: "none" }}
          >
            {Object.keys(SQ_TORRENT_CATEGORIES).map((category) => (
              <CategoryItem key={category}>
                <Link
                  href={`/categories/${slugify(category, { lower: true })}`}
                  passHref
                >
                  <a>{category}</a>
                </Link>
              </CategoryItem>
            ))}
          </Box>
        ) : (
          <Text color="grey">
            {getLocaleString("catNoCategoryHaveBeenDefined")}
          </Text>
        )}
      </Box>
      <Text as="h1" mb={5}>
        {getLocaleString("uploadTags")}
      </Text>
      {tags.length ? (
        <Box display="flex" flexWrap="wrap" ml={-1} mt={-1}>
          {tags.map((tag) => (
            <Box
              key={`tag-${tag}`}
              bg="sidebar"
              border="1px solid"
              borderColor="border"
              borderRadius={1}
              m={1}
            >
              <Link href={`/tags/${tag}`} passHref>
                <Text
                  as="a"
                  display="block"
                  color="text"
                  _css={{ "&:visited": { color: "text" } }}
                  px={3}
                  py={1}
                >
                  {tag}
                </Text>
              </Link>
            </Box>
          ))}
        </Box>
      ) : (
        <Text color="grey">{getLocaleString("catNoTagsHaveBeenDefined")}</Text>
      )}
    </>
  );
};

export const getServerSideProps = withAuthServerSideProps(
  async ({ token, fetchHeaders, isPublicAccess }) => {
    if (!token && !isPublicAccess) return { props: {} };

    const {
      publicRuntimeConfig: { SQ_API_URL },
    } = getConfig();

    try {
      const tagsRes = await fetch(`${SQ_API_URL}/torrent/tags`, {
        headers: fetchHeaders,
      });
      if (
        tagsRes.status === 403 &&
        (await tagsRes.text()) === "User is banned"
      ) {
        throw "banned";
      }
      const tags = await tagsRes.json();
      return { props: { tags } };
    } catch (e) {
      if (e === "banned") throw "banned";
      return { props: {} };
    }
  },
  true
);

export default Categories;
