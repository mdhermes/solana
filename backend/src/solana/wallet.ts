import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import bs58 from "bs58";
import fs from "fs";

const USDC_MINT_DEVNET = new PublicKey(
  "BCqAit2k2gSEuwCiXLFW2osptnB3EC6D8RkuFkxKLbNL",
);

export const connection = new Connection(
  process.env.SOLANA_RPC_URL!,
  "confirmed",
);

export function loadOrCreateWallet(): Keypair {
  const keyPath = "./agent-wallet.json";
  if (fs.existsSync(keyPath)) {
    const raw = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  const kp = Keypair.generate();
  fs.writeFileSync(keyPath, JSON.stringify(Array.from(kp.secretKey)));
  console.log("New wallet created:", kp.publicKey.toBase58());
  console.log("Fund it at: https://spl-token-faucet.com/?token-name=USDC-Dev");
  return kp;
}

export async function getUsdcBalance(pubkey: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT_DEVNET, pubkey);
    const info = await connection.getTokenAccountBalance(ata);
    return Number(info.value.uiAmount);
  } catch {
    return 0;
  }
}

export { USDC_MINT_DEVNET };
