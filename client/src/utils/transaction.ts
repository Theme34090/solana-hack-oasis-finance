
import { Connection, Context, SignatureResult } from "@solana/web3.js";
import { toast } from "react-toastify";
import { notifySuccess, notifyError } from "../components/ui/notification/notification";

export const confirmTransaction = (
    txid: string,
    connection: Connection,
) => {

    const listenerID = connection.onSignature(
        txid,
        (signatureResult: SignatureResult, context: Context) => {
            const { slot } = context;

            if (!signatureResult.err) {
                // success
                notifySuccess(txid);
            } else {
                // failed
                notifyError(txid);
                console.error(signatureResult.err)
            }

        }
    )


}