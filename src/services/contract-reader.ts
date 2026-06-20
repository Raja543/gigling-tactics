import {
  createPublicClient,
  http,
  defineChain,
  getAddress,
  parseAbi,
  parseAbiItem,
} from "viem";

// Abstract Chain (mainnet) - chainId 2741 / 0xab5.
const abstract = defineChain({
  id: 2741,
  name: "Abstract",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ABSTRACT_RPC || "https://api.mainnet.abs.xyz",
      ],
    },
  },
});

const client = createPublicClient({ chain: abstract, transport: http() });

const GIGA_PET_NFT = (process.env.NEXT_PUBLIC_GIGA_PET_NFT_ADDRESS ||
  "0xd320831c876190c7ef79376ffcc889756f038e04") as `0x${string}`;

const erc721Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

/** Number of GigaPet NFTs currently held by a wallet. */
export async function getPetBalance(owner: string): Promise<number> {
  const balance = await client.readContract({
    address: GIGA_PET_NFT,
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [getAddress(owner)],
  });
  return Number(balance);
}

/**
 * Return the GigaPet token IDs a wallet currently owns.
 *
 * GigaPetNFT is not ERC721Enumerable, so we collect every token ever
 * transferred *to* the wallet via Transfer logs and then confirm current
 * ownership with `ownerOf` (tokens may have since been transferred out).
 */
export async function getOwnedPetIds(owner: string): Promise<number[]> {
  const ownerAddr = getAddress(owner);

  const logs = await client.getLogs({
    address: GIGA_PET_NFT,
    event: transferEvent,
    args: { to: ownerAddr },
    fromBlock: BigInt(0),
    toBlock: "latest",
  });

  const candidates = new Set<bigint>();
  for (const log of logs) {
    const tokenId = log.args.tokenId;
    if (typeof tokenId === "bigint") candidates.add(tokenId);
  }

  const owned: number[] = [];
  await Promise.all(
    [...candidates].map(async (tokenId) => {
      try {
        const current = await client.readContract({
          address: GIGA_PET_NFT,
          abi: erc721Abi,
          functionName: "ownerOf",
          args: [tokenId],
        });
        if (getAddress(current) === ownerAddr) owned.push(Number(tokenId));
      } catch {
        // Token burned or otherwise non-resolvable - skip it.
      }
    }),
  );

  return owned.sort((a, b) => a - b);
}
