# ATH Staking Production Multisig Migration Procedure

## Decisions required before Mainnet
- Multisig implementation/provider.
- Production multisig address.
- Signer identities/devices and approved threshold.
- Recovery/replacement policy.
- Separation policy for Staking, Mining and Presale/Token owners.

## Migration sequence
1. Complete independent smart-contract audit.
2. Verify the production multisig and perform a non-critical test transaction.
3. Record signer set and threshold outside public source control.
4. Confirm target is not deployer, Keeper, treasury or ordinary operations EOA.
5. Keep ATH Staking PAUSED.
6. Transfer ownership using the contract ownership mechanism.
7. Confirm owner() equals the approved multisig.
8. From multisig, execute a harmless owner-only control check while still PAUSED.
9. Re-run ownership and release invariants.
10. Only after all launch gates pass may the multisig explicitly open Staking.

## Separation of duties
- Staking Owner/Multisig: package administration, reserve funding, pause/unpause.
- Keeper: automation only; never owner.
- Treasury: not owner by default.
- Web/Admin server: never stores multisig seed phrases/private keys.

## Fail-closed rules
No fallback production EOA owner. No private key in repository, UI, database or chat. Ownership migration does not authorize Mainnet opening. If target ownership cannot be independently verified, remain PAUSED.
