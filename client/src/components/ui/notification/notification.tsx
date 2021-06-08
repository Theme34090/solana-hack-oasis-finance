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

export const notifyInfo = (message?: string): void => {
  if (!message) {
    message = "Transaction has been sent";
  }
  toast.info(<Message message={message} />, {
    autoClose: 5000, // 10s
    pauseOnHover: false,
    hideProgressBar: true,
  });
};

export const notifySuccess = (txId: string) => {
  toast.success(
    <Message message="Transaction has been confirmed" txId={txId} />,
    {
      autoClose: 10000, // 10s
      pauseOnHover: false,
      hideProgressBar: true,
    }
  );
};

export const notifyError = (message?: string) => {
  if (!message) {
    message = "Transaction failed";
  }
  toast.error(<Message message={message} />, {
    autoClose: 5000, // 10s
    pauseOnHover: false,
    hideProgressBar: true,
  });
};

export default Notification;
