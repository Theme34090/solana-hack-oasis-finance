import { useConnectionConfig } from "../../../../store/connection";

import classes from "./message.module.css";

interface MessageProps {
  txId?: string;
  message: string;
}

const Message: React.FC<MessageProps> = ({ txId, message }) => {
  const { env } = useConnectionConfig();
  return (
    <>
      <h3 className={classes.Title}>{message}</h3>
      {txId ? (
        <p className={classes.Description}>
          You can view your transaction{" "}
          <a
            href={`https://explorer.solana.com/tx/${txId}?cluster=${env}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
        </p>
      ) : null}
    </>
  );
};

export default Message;
