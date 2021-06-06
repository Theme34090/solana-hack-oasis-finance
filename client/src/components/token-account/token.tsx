import { useWallet } from "../../store/wallet";
import styled from "styled-components";

const Table = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.2fr;
  border: 1px solid white;
  margin: 30vh 10vw;
`;

const Col = styled.div``;

const Row = styled.div`
  font-size: 0.5rem;
  padding: 1rem;
  border: 1px solid white;
`;

const RowHeader = styled(Row)`
  font-size: 1rem;
  font-weight: bold;
  color: #50df50;
`;

const Token: React.FC = () => {
  const { tokenAccounts } = useWallet();

  const tokenList = Object.keys(tokenAccounts).map((token) => (
    <>
      <Row>{token}</Row>
      <Row>{tokenAccounts[token].tokenAccountAddress}</Row>
      <Row> {tokenAccounts[token].balance.fixed()}</Row>
    </>
  ));

  return (
    <>
      <Table>
        <RowHeader>TOKEN</RowHeader>
        <RowHeader>ACCOUNT ADDRESS</RowHeader>
        <RowHeader>BALANCE</RowHeader>
        {tokenList}
      </Table>
    </>
  );
};

export default Token;
