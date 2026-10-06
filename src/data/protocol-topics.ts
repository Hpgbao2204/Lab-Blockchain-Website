/**
 * Protocol and theory topics the daily desk explains on days without a good news story, each
 * with the papers or specifications a post must cite (the bot may only cite these, so every
 * link in its Sources list is real). Used topics are not repeated until the list runs out.
 */
export interface Reference {
  title: string;
  authors: string;
  year: number;
  venue?: string;
  url: string;
}

export interface ProtocolTopic {
  key: string;
  title: string;
  /** what the explainer should cover */
  angle: string;
  refs: Reference[];
}

export const PROTOCOL_TOPICS: ProtocolTopic[] = [
  {
    key: "byzantine-generals",
    title: "The Byzantine Generals Problem",
    angle: "the problem statement, why 3f+1 nodes are needed with oral messages, and why it matters for blockchains",
    refs: [{ title: "The Byzantine Generals Problem", authors: "L. Lamport, R. Shostak, M. Pease", year: 1982, venue: "ACM TOPLAS", url: "https://doi.org/10.1145/357172.357176" }],
  },
  {
    key: "flp",
    title: "FLP impossibility",
    angle: "what FLP proves about deterministic consensus in asynchrony and how real protocols work around it (partial synchrony, randomness)",
    refs: [{ title: "Impossibility of Distributed Consensus with One Faulty Process", authors: "M. J. Fischer, N. A. Lynch, M. S. Paterson", year: 1985, venue: "Journal of the ACM", url: "https://doi.org/10.1145/3149.214121" }],
  },
  {
    key: "pbft",
    title: "Practical Byzantine Fault Tolerance (PBFT)",
    angle: "the pre-prepare/prepare/commit phases, view changes, and the O(n^2) message cost",
    refs: [{ title: "Practical Byzantine Fault Tolerance", authors: "M. Castro, B. Liskov", year: 1999, venue: "OSDI", url: "https://pmg.csail.mit.edu/papers/osdi99.pdf" }],
  },
  {
    key: "nakamoto",
    title: "Nakamoto consensus",
    angle: "proof of work, the longest-chain rule, confirmation depth and the probabilistic finality argument",
    refs: [
      { title: "Bitcoin: A Peer-to-Peer Electronic Cash System", authors: "S. Nakamoto", year: 2008, url: "https://bitcoin.org/bitcoin.pdf" },
      { title: "The Bitcoin Backbone Protocol: Analysis and Applications", authors: "J. Garay, A. Kiayias, N. Leonardos", year: 2015, venue: "EUROCRYPT", url: "https://eprint.iacr.org/2014/765" },
    ],
  },
  {
    key: "selfish-mining",
    title: "Selfish mining",
    angle: "how withholding blocks earns more than a fair share, the profitability threshold, and proposed defences",
    refs: [{ title: "Majority is not Enough: Bitcoin Mining is Vulnerable", authors: "I. Eyal, E. G. Sirer", year: 2014, venue: "Financial Cryptography", url: "https://arxiv.org/abs/1311.0243" }],
  },
  {
    key: "ghost",
    title: "GHOST fork choice",
    angle: "heaviest-subtree fork choice versus longest chain, and why it helps at high block rates",
    refs: [{ title: "Secure High-Rate Transaction Processing in Bitcoin", authors: "Y. Sompolinsky, A. Zohar", year: 2015, venue: "Financial Cryptography", url: "https://eprint.iacr.org/2013/881" }],
  },
  {
    key: "tendermint",
    title: "Tendermint BFT",
    angle: "rounds of propose/prevote/precommit, locking, and instant finality in Cosmos chains",
    refs: [{ title: "The latest gossip on BFT consensus", authors: "E. Buchman, J. Kwon, Z. Milosevic", year: 2018, url: "https://arxiv.org/abs/1807.04938" }],
  },
  {
    key: "hotstuff",
    title: "HotStuff",
    angle: "linear view change, the three-chain commit rule, pipelining, and its influence on later BFT chains",
    refs: [{ title: "HotStuff: BFT Consensus with Linearity and Responsiveness", authors: "M. Yin, D. Malkhi, M. K. Reiter, G. Golan Gueta, I. Abraham", year: 2019, venue: "PODC", url: "https://arxiv.org/abs/1803.05069" }],
  },
  {
    key: "casper-gasper",
    title: "Casper FFG and Gasper (Ethereum proof of stake)",
    angle: "checkpoints, justification and finalization, slashing conditions, and how LMD-GHOST combines with FFG",
    refs: [
      { title: "Casper the Friendly Finality Gadget", authors: "V. Buterin, V. Griffith", year: 2017, url: "https://arxiv.org/abs/1710.09437" },
      { title: "Combining GHOST and Casper", authors: "V. Buterin et al.", year: 2020, url: "https://arxiv.org/abs/2003.03052" },
    ],
  },
  {
    key: "ouroboros",
    title: "Ouroboros proof of stake",
    angle: "epochs and slot leaders, stake-based leader election, and the security argument",
    refs: [{ title: "Ouroboros: A Provably Secure Proof-of-Stake Blockchain Protocol", authors: "A. Kiayias, A. Russell, B. David, R. Oliynykov", year: 2017, venue: "CRYPTO", url: "https://eprint.iacr.org/2016/889" }],
  },
  {
    key: "algorand",
    title: "Algorand",
    angle: "cryptographic sortition with VRFs, BA* agreement, and player replaceability",
    refs: [{ title: "Algorand: Scaling Byzantine Agreements for Cryptocurrencies", authors: "Y. Gilad, R. Hemo, S. Micali, G. Vlachos, N. Zeldovich", year: 2017, venue: "SOSP", url: "https://eprint.iacr.org/2017/454" }],
  },
  {
    key: "narwhal-tusk",
    title: "DAG-based consensus: Narwhal and Tusk",
    angle: "separating data dissemination from ordering, the DAG mempool, and throughput results",
    refs: [{ title: "Narwhal and Tusk: A DAG-based Mempool and Efficient BFT Consensus", authors: "G. Danezis, L. Kokoris-Kogias, A. Sonnino, A. Spiegelman", year: 2022, venue: "EuroSys", url: "https://arxiv.org/abs/2105.11827" }],
  },
  {
    key: "merkle",
    title: "Merkle trees and inclusion proofs",
    angle: "hash trees, logarithmic inclusion proofs, and where blockchains use them (block headers, light clients)",
    refs: [{ title: "A Digital Signature Based on a Conventional Encryption Function", authors: "R. C. Merkle", year: 1987, venue: "CRYPTO", url: "https://doi.org/10.1007/3-540-48184-2_32" }],
  },
  {
    key: "bls",
    title: "BLS signatures and aggregation",
    angle: "pairing-based short signatures, aggregation, and why Ethereum validators use them",
    refs: [{ title: "Short Signatures from the Weil Pairing", authors: "D. Boneh, B. Lynn, H. Shacham", year: 2001, venue: "ASIACRYPT", url: "https://doi.org/10.1007/3-540-45682-1_30" }],
  },
  {
    key: "ethereum-evm",
    title: "The Ethereum state machine and the EVM",
    angle: "accounts, transactions, gas, and how the EVM executes contracts",
    refs: [{ title: "Ethereum: A Secure Decentralised Generalised Transaction Ledger (Yellow Paper)", authors: "G. Wood", year: 2014, url: "https://ethereum.github.io/yellowpaper/paper.pdf" }],
  },
  {
    key: "eip-1559",
    title: "EIP-1559 transaction fee mechanism",
    angle: "base fee and tip, the burn, and what the economic analysis says about incentives",
    refs: [
      { title: "EIP-1559: Fee market change for ETH 1.0 chain", authors: "V. Buterin et al.", year: 2019, url: "https://eips.ethereum.org/EIPS/eip-1559" },
      { title: "Transaction Fee Mechanism Design for the Ethereum Blockchain: An Economic Analysis of EIP-1559", authors: "T. Roughgarden", year: 2020, url: "https://arxiv.org/abs/2012.00854" },
    ],
  },
  {
    key: "account-abstraction",
    title: "Account abstraction (ERC-4337)",
    angle: "UserOperations, bundlers, the EntryPoint contract, and paymasters",
    refs: [{ title: "ERC-4337: Account Abstraction Using Alt Mempool", authors: "V. Buterin et al.", year: 2021, url: "https://eips.ethereum.org/EIPS/eip-4337" }],
  },
  {
    key: "htlc-atomic-swaps",
    title: "HTLCs and atomic cross-chain swaps",
    angle: "hash locks and time locks, the swap protocol step by step, and its failure cases",
    refs: [{ title: "Atomic Cross-Chain Swaps", authors: "M. Herlihy", year: 2018, venue: "PODC", url: "https://arxiv.org/abs/1801.09515" }],
  },
  {
    key: "lightning",
    title: "Payment channels and the Lightning Network",
    angle: "commitment transactions, revocation, routing with HTLCs, and the limits of channels",
    refs: [{ title: "The Bitcoin Lightning Network: Scalable Off-Chain Instant Payments", authors: "J. Poon, T. Dryja", year: 2016, url: "https://lightning.network/lightning-network-paper.pdf" }],
  },
  {
    key: "cross-chain-sok",
    title: "Cross-chain communication and bridges",
    angle: "what makes cross-chain communication hard, the main bridge designs, and their trust assumptions",
    refs: [{ title: "SoK: Communication Across Distributed Ledgers", authors: "A. Zamyatin et al.", year: 2021, venue: "Financial Cryptography", url: "https://eprint.iacr.org/2019/1128" }],
  },
  {
    key: "ibc",
    title: "The Inter-Blockchain Communication protocol (IBC)",
    angle: "light clients, connections, channels and packets, and how Cosmos chains talk to each other",
    refs: [{ title: "The Interblockchain Communication Protocol: An Overview", authors: "C. Goes", year: 2020, url: "https://arxiv.org/abs/2006.15918" }],
  },
  {
    key: "optimistic-rollups",
    title: "Optimistic rollups and fraud proofs",
    angle: "posting state off-chain, challenge periods, interactive bisection, and the trust model",
    refs: [{ title: "Arbitrum: Scalable, private smart contracts", authors: "H. Kalodner, S. Goldfeder, X. Chen, S. M. Weinberg, E. W. Felten", year: 2018, venue: "USENIX Security", url: "https://www.usenix.org/conference/usenixsecurity18/presentation/kalodner" }],
  },
  {
    key: "data-availability",
    title: "Data availability sampling",
    angle: "the data availability problem, erasure coding, and how light clients sample to gain confidence",
    refs: [{ title: "Fraud and Data Availability Proofs: Maximising Light Client Security and Scaling Blockchains with Dishonest Majorities", authors: "M. Al-Bassam, A. Sonnino, V. Buterin", year: 2018, url: "https://arxiv.org/abs/1809.09044" }],
  },
  {
    key: "sharding",
    title: "Sharding a blockchain",
    angle: "splitting state and validators into shards, cross-shard transactions, and the security of shard assignment",
    refs: [{ title: "OmniLedger: A Secure, Scale-Out, Decentralized Ledger via Sharding", authors: "E. Kokoris-Kogias et al.", year: 2018, venue: "IEEE S&P", url: "https://eprint.iacr.org/2017/406" }],
  },
  {
    key: "groth16",
    title: "zk-SNARKs: Groth16",
    angle: "what a SNARK proves, circuits and R1CS at a high level, trusted setup, and why proofs are tiny",
    refs: [{ title: "On the Size of Pairing-based Non-interactive Arguments", authors: "J. Groth", year: 2016, venue: "EUROCRYPT", url: "https://eprint.iacr.org/2016/260" }],
  },
  {
    key: "plonk",
    title: "PLONK and universal setups",
    angle: "universal and updatable setup, polynomial commitments, and why many zk-rollups adopted it",
    refs: [{ title: "PLONK: Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge", authors: "A. Gabizon, Z. J. Williamson, O. Ciobotaru", year: 2019, url: "https://eprint.iacr.org/2019/953" }],
  },
  {
    key: "starks",
    title: "zk-STARKs",
    angle: "transparent setup, hash-based security, FRI at a high level, and the proof size trade-off",
    refs: [{ title: "Scalable, transparent, and post-quantum secure computational integrity", authors: "E. Ben-Sasson, I. Bentov, Y. Horesh, M. Riabzev", year: 2018, url: "https://eprint.iacr.org/2018/046" }],
  },
  {
    key: "zerocash",
    title: "Private payments: Zerocash",
    angle: "shielded notes, commitments and nullifiers, and how zk-SNARKs hide sender, receiver and amount",
    refs: [{ title: "Zerocash: Decentralized Anonymous Payments from Bitcoin", authors: "E. Ben-Sasson et al.", year: 2014, venue: "IEEE S&P", url: "https://eprint.iacr.org/2014/349" }],
  },
  {
    key: "mev",
    title: "Maximal extractable value (MEV)",
    angle: "front-running and priority gas auctions, why miners and validators profit from ordering, and the risks to consensus",
    refs: [{ title: "Flash Boys 2.0: Frontrunning in Decentralized Exchanges, Miner Extractable Value, and Consensus Instability", authors: "P. Daian et al.", year: 2020, venue: "IEEE S&P", url: "https://arxiv.org/abs/1904.05234" }],
  },
  {
    key: "amm",
    title: "Automated market makers (constant product)",
    angle: "the x*y=k invariant, price impact, arbitrage keeping prices aligned, and impermanent loss",
    refs: [{ title: "An analysis of Uniswap markets", authors: "G. Angeris, H.-T. Kao, R. Chiang, C. Noyes, T. Chitra", year: 2019, url: "https://arxiv.org/abs/1911.03380" }],
  },
  {
    key: "smart-contract-attacks",
    title: "Classic smart contract vulnerabilities",
    angle: "reentrancy, transaction-ordering dependence, timestamp dependence and mishandled exceptions, with the DAO as the example",
    refs: [
      { title: "Making Smart Contracts Smarter", authors: "L. Luu, D.-H. Chu, H. Olickel, P. Saxena, A. Hobor", year: 2016, venue: "ACM CCS", url: "https://eprint.iacr.org/2016/633" },
      { title: "A Survey of Attacks on Ethereum Smart Contracts", authors: "N. Atzei, M. Bartoletti, T. Cimoli", year: 2017, venue: "POST", url: "https://eprint.iacr.org/2016/1007" },
    ],
  },
];

export const topicByKey = (key: string) => PROTOCOL_TOPICS.find((t) => t.key === key);
