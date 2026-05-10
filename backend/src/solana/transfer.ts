import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { connection, USDC_MINT_DEVNET } from "./wallet";

export async function sendUsdc(
  from: Keypair,
  toAddress: string,
  amountUsdc: number,
): Promise<string> {
  const toPubkey = new PublicKey(toAddress);
  const fromAta = await getOrCreateAssociatedTokenAccount(
    connection,
    from,
    USDC_MINT_DEVNET,
    from.publicKey,
  );
  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    from,
    USDC_MINT_DEVNET,
    toPubkey,
  );

  const amount = BigInt(Math.round(amountUsdc * 1_000_000)); // USDC = 6 decimals

  const tx = new Transaction().add(
    createTransferInstruction(
      fromAta.address,
      toAta.address,
      from.publicKey,
      amount,
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [from]);
  return sig;
}
