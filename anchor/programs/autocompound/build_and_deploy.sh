cargo build-bpf || exit 1;
solana program deploy --program-id ../../target/deploy/autocompound-keypair.json ../../target/deploy/autocompound.so || exit 1;
