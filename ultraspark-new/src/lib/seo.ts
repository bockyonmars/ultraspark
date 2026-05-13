import { BRAND_NAME } from "@/lib/constants";

export const metaFor = (title: string, description: string) => {
  const pageTitle = title === BRAND_NAME ? BRAND_NAME : `${title} | ${BRAND_NAME}`;

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: description },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:site_name", content: BRAND_NAME },
    ],
  };
};
