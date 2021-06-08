import React from "react";
import { toast, ToastContainer } from "react-toastify";
import Message from "./message/message";

import "react-toastify/dist/ReactToastify.css";
import "./notification.css";

const Notification: React.FC = () => {
  return (
    <ToastContainer
      position="bottom-left"
      autoClose={false}
      newestOnTop={true}
    />
  );
};

export const notifyInfo = (txId: string): void => {
  toast.info(<Message message="Transaction has been sent" txId={txId} />, {
    autoClose: false, // 10s
    pauseOnHover: false,
    hideProgressBar: true,
  });
};

export const notifySuccess = (txId: string) => {
  toast.success(
    <Message message="Transaction has been confirmed" txId={txId} />,
    {
      autoClose: false, // 10s
      pauseOnHover: false,
      hideProgressBar: true,
    }
  );
};

export const notifyError = (txId: string) => {
  toast.error(<Message message="Transaction failed" txId={txId} />, {
    autoClose: false, // 10s
    pauseOnHover: false,
    hideProgressBar: true,
  });
};

export default Notification;
