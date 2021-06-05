import Header from "../../components/ui/header/header";
import Farm from "../farm/farm";

export const LandingView = (props: {}) => {
  // const tk = Object.keys(tokenAccounts).map((token) => (
  //   <Account>
  //     <Title>
  //       <Span>TOKEN : </Span> {token}
  //     </Title>
  //     <Text>
  //       <Span>ACCOUNT ADDRESS : </Span>{" "}
  //       {tokenAccounts[token].tokenAccountAddress}
  //     </Text>
  //     <Text>
  //       <Span>ACCOUNT BALANCE: </Span> {tokenAccounts[token].balance.fixed()}
  //     </Text>
  //   </Account>
  // ));

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
