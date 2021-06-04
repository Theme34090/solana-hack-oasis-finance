import { useEffect, useState } from "react";
import classes from "./landing.module.css";

import Header from "../../components/ui/header/header";
import Liquidity from "../liquidity/liquidity";
import Swap from "../swap/swap";
import Farm from "../farm/farm";
import styled from "styled-components";
import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";
import { getTokenAccounts } from "../../utils/wallet";

const Account = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid white;
`;

const Title = styled.h3`
  font-family: inherit;
  font-size: small;
  text-align: left;
`;

const Text = styled.p`
  font-family: inherit;
  font-size: small;
  text-align: center;
`;

const Span = styled.span`
  color: #ee7373;
`;

export const LandingView = (props: {}) => {
  const [tokenAccounts, setTokenAccounts] = useState<any>({});
  const connection = useConnection();
  const { wallet } = useWallet();

  const getTokenAccountHandler = () => {
    if (wallet && connection) {
      getTokenAccounts(connection, wallet).then((tk) => setTokenAccounts(tk));
    }
  };

  const tk = Object.keys(tokenAccounts).map((token) => (
    <Account>
      <Title>
        <Span>TOKEN : </Span> {token}
      </Title>
      <Text>
        <Span>ACCOUNT ADDRESS : </Span>{" "}
        {tokenAccounts[token].tokenAccountAddress}
      </Text>
      <Text>
        <Span>ACCOUNT BALANCE: </Span> {tokenAccounts[token].balance.fixed()}
      </Text>
    </Account>
  ));

  return (
    // <main>
    //   <main className={classes.MainContent}>
    //     {/* <Pool /> */}
    //     <Liquidity />
    //     <hr />
    //     <Swap />
    //     <hr />
    //     <Farm tokenAccounts={tokenAccounts} />
    //     <hr />
    //   </main>
    // </main>
    <main>
      <Header />
      <Farm />
    </main>
  );
};
