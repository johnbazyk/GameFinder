/** Amazon Associates tag. Empty until you send yours — then earnings start. */
export const AMAZON_ASSOCIATE_TAG = "";

export function amazonSearchUrl(gameName: string): string {
  const params = new URLSearchParams({
    k: `${gameName} board game`,
  });
  if (AMAZON_ASSOCIATE_TAG) params.set("tag", AMAZON_ASSOCIATE_TAG);
  return `https://www.amazon.com/s?${params.toString()}`;
}

export function hasAffiliateTag(): boolean {
  return AMAZON_ASSOCIATE_TAG.length > 0;
}
