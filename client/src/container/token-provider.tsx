import React, { useEffect, useState } from "react";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";

new TokenListProvider().resolve().then((tokens) => {
  const tokenList = tokens.filterByClusterSlug("mainnet-beta").getList();
  console.log(tokenList);
});
