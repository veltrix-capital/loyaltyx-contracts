# Veltrix LoyaltyX Smart Contracts

Modular, upgradeable smart contracts for the Veltrix LoyaltyX platform — enabling businesses to launch and manage token-based loyalty and redemption systems with plug-and-play modules.

---

## 🚀 Overview

Veltrix LoyaltyX is a blockchain-based loyalty protocol supporting:

- 🪙 ERC-20-based loyalty tokens per business
- 🎁 Modular reward logic (e.g., token minting, coupon rewards)
- 🎟️ Modular redeem logic (e.g., token burning, NFT or coupon redemption)
- ♻️ Upgradeable architecture (via OpenZeppelin 5.3)
- 🔌 Plug-in modules for extensibility

---

## 📁 Project Structure

```
contracts/
│
├── BaseToken.sol                # Upgradeable ERC20 token with minter control and transfer lock
├── TokenFactory.sol             # Deploys BaseToken clones
│
├── RewardRouter.sol             # Routes behavior-based reward logic to modules
├── RedeemRouter.sol             # Routes redemption requests to modules
│
├── modules/
│   ├── reward/
│   │   └── TokenRewardModule.sol     # Mints tokens as rewards
│   └── redeem/
│       └── TokenBurnRedeemModule.sol # Burns tokens on redemption
│
├── interfaces/
│   ├── IRewardModule.sol
│   └── IRedeemModule.sol
```

---

## 🛠️ Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/loyaltyx-contracts.git
cd loyaltyx-contracts

# 2. Install dependencies
npm install

# 3. Compile contracts
npx hardhat compile

# 4. Run tests
npx hardhat test
```

---

## 🧪 Tests

All contracts are fully tested using Hardhat + TypeScript.

```bash
# Run all tests
npx hardhat test

# Run a specific test
npx hardhat test test/TokenRewardModule.test.ts
```

---

## 🔧 Tech Stack

- [Hardhat](https://hardhat.org/)
- Solidity `^0.8.20`
- TypeScript + Chai + Ethers for tests
- OpenZeppelin Upgradeable Contracts `^5.3.0`

---

## 🧱 Core Concepts

| Component        | Role                                              |
|------------------|---------------------------------------------------|
| BaseToken        | ERC-20 token with `mint`, `burn`, and transfer lock
| TokenFactory     | Clones tokens per business
| RewardRouter     | Forwards behavior triggers to reward modules
| RedeemRouter     | Routes redemption to redeem modules
| Reward Modules   | Plug-in logic (e.g., token minting)
| Redeem Modules   | Plug-in logic (e.g., token burning)

---

## 📦 Deployment Scripts

TBD — a full deployment script is in progress to:

- Deploy BaseToken + Factory
- Deploy Routers
- Install reward and redeem modules
- Link modules to business tokens

---

## 📜 License

MIT — see `LICENSE`

---

## 🤝 Contact

Veltrix Capital — [website](https://veltrix.com) | [LinkedIn](https://linkedin.com/company/veltrix)