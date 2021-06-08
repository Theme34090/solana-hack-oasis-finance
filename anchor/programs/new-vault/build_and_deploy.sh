cargo build-bpf || exit 1;
solana program deploy --program-id ../../target/deploy/swap-keypair.json ../../target/deploy/newVault.so || exit 1;
