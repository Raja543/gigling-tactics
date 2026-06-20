import { generateCard } from "@/engine/card-generator";
import { normalizeAddress } from "@/lib/utils";
import { recalcUserCollectionScore } from "@/engine/collection-score";
import { unlockAchievements } from "@/engine/achievements";
import { fetchPets, petToPetData } from "./gigaverse-api";
import { getOwnedPetIds } from "./contract-reader";
import { ensureUser, upsertGeneratedCard, type SyncResult } from "./card-sync";

export interface ImportResult extends SyncResult {
  petIds: number[];
}

/**
 * Import a wallet's real Gigling NFTs:
 *   1. read owned token IDs from the GigaPetNFT contract on Abstract,
 *   2. fetch each pet's racing data from the Gigaverse API,
 *   3. generate + persist a card (with real NFT art) per pet.
 */
export async function importGiglingsForWallet(
  rawWalletAddress: string,
): Promise<ImportResult> {
  const walletAddress = normalizeAddress(rawWalletAddress);
  const result: ImportResult = {
    cardsAdded: 0,
    cardsUpdated: 0,
    errors: [],
    petIds: [],
  };

  // The on-chain lookup needs the real (checksummed-tolerant) address; viem
  // checksums internally. Persist under the normalized lowercase address.
  const petIds = await getOwnedPetIds(walletAddress);
  result.petIds = petIds;
  if (petIds.length === 0) return result;

  const pets = await fetchPets(petIds);
  const user = await ensureUser(walletAddress);

  for (const pet of pets) {
    try {
      const generated = generateCard(petToPetData(pet));
      const outcome = await upsertGeneratedCard(user.id, generated, {
        imageUrl: pet.imgUrl,
      });
      if (outcome === "added") result.cardsAdded++;
      else result.cardsUpdated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`Pet ${pet.id}: ${message}`);
    }
  }

  // Refresh collection score + unlock any newly earned achievements.
  await recalcUserCollectionScore(user.id);
  await unlockAchievements(user.id);

  return result;
}
