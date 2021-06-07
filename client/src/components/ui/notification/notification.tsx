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

export const notifyInfo = (): void => {
  toast.info(<Message message="Transaction has been sent" />, {
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

export const notifyError = () => {
  toast.error(<Message message="Transaction failed" />, {
    autoClose: false, // 10s
    pauseOnHover: false,
    hideProgressBar: true,
  });
};

export default Notification;
