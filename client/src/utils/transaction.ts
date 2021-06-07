import { Connection, Context, SignatureResult } from "@solana/web3.js";
import { notify } from "../utils/notification";

export const confirmTransaction = (
    txid: string,
    description: string,
    connection: Connection,
) => {

    const listenerID = connection.onSignature(
        txid,
        (signatureResult: SignatureResult, context: Context) => {
            const { slot } = context;

            if (!signatureResult.err) {
                // success
                alert("Transaction has been confirmed")

            } else {
                // failed
                alert(`Transaction failed : ${signatureResult.err}`)
                console.error(signatureResult.err)
            }

        }
    )


}