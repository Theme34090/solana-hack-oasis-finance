
import { Connection, Context, SignatureResult } from "@solana/web3.js";
import { notifySuccess, notifyError } from "../components/ui/notification/notification";

export const confirmTransaction = (
    txid: string,
    connection: Connection,
) => {

    connection.onSignature(
        txid,
        (signatureResult: SignatureResult, _context: Context) => {

            if (!signatureResult.err) {
                // success
                notifySuccess(txid);
            } else {
                // failed
                notifyError();
                console.error(signatureResult.err)
            }

        }
    )


}