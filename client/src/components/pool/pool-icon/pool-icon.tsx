import { useConnectionConfig } from "../../../store/connection";
import { getTokenIcon } from "../../../utils/utils";

type TokenIconProps = {
  mintAddress: string;
  style?: React.CSSProperties;
};

const TokenIcon: React.FC<TokenIconProps> = ({ mintAddress, style }) => {
  const { env } = useConnectionConfig();
  const icon = getTokenIcon("mainnet-beta", mintAddress);

  if (icon) {
    return (
      <img
        alt="Token icon"
        key={mintAddress}
        width="20"
        height="20"
        src={icon}
        style={{
          marginRight: "0.5rem",
          marginTop: "0.11rem",
          borderRadius: "1rem",
          backgroundColor: "white",
          backgroundClip: "padding-box",
          ...style,
        }}
      />
    );
  }

  return <img></img>;
};

type PoolIconProps = {
  mintA: string;
  mintB: string;
  style?: React.CSSProperties;
};

const PoolIcon: React.FC<PoolIconProps> = ({ mintA, mintB, style }) => {
  return (
    <div style={{ display: "flex" }}>
      <TokenIcon
        mintAddress={mintA}
        style={{ marginRight: "-0.5rem", ...style }}
      />
      <TokenIcon mintAddress={mintB} />
    </div>
  );
};

export default PoolIcon;
