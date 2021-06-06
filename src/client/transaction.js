

const sendTransactions = async (transactionsAndSigners, wallet, connection) => {
    const blockhash = (await connection.getRecentBlockhash("max")).blockhash;
    transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
        transaction.recentBlockhash = blockhash;
        transaction.setSigners(
            wallet.publicKey,
            ...signers.map((s) => s.publicKey)
        );
        if (signers?.length > 0) {
            transaction.partialSign(...signers);
        }
    });

    const signedTransactions = await wallet.signAllTransactions(
        transactionsAndSigners.map(({ transaction }) => transaction)
    );

    for (let signedTransaction of signedTransactions) {
        await sendAndConfirmRawTransaction(
            connection,
            signedTransaction.serialize()
        );
    }
}

const sendAndConfirmRawTransaction = async (connection, raw, commitment = "recent") => {
    let tx = await connection.sendRawTransaction(raw, { skipPreflight: true });
    return await connection.confirmTransaction(tx, commitment);
}


module.exports = {
    sendTransactions
}