import { BRAND_NAME } from "@/lib/constants";

export const metaFor = (title: string, description: string) => ({
  meta: [
    { title: `${title} | ${BRAND_NAME}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ${BRAND_NAME}` },
    { property: "og:description", content: description },
    { property: "og:site_name", content: BRAND_NAME },
  ],
});
