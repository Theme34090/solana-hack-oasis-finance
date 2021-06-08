cargo build-bpf || exit 1;
solana program deploy --program-id ../../target/deploy/swap-keypair.json ../../target/deploy/swap.so || exit 1;
