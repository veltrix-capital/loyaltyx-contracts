import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts as:", deployer.address);

  // Deploy BaseToken
  const TokenFactory = await ethers.getContractFactory("BaseToken", deployer);
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  await token.initialize("VeltrixToken", "VLTX", deployer.address);
  console.log("BaseToken deployed to:", await token.getAddress());

  // Deploy TokenRewardModule
  const ModuleFactory = await ethers.getContractFactory("TokenRewardModule", deployer);
  const module = await ModuleFactory.deploy();
  await module.waitForDeployment();
  await module.initialize(await token.getAddress(), 5, deployer.address); // 5x multiplier
  console.log("TokenRewardModule deployed to:", await module.getAddress());

  // Grant module permission to mint
  await token.setMinter(await module.getAddress(), true);
  console.log("Module set as minter");

  // Deploy RewardRouter
  const RouterFactory = await ethers.getContractFactory("RewardRouter", deployer);
  const router = await RouterFactory.deploy();
  await router.waitForDeployment();
  await router.initialize(deployer.address);
  console.log("RewardRouter deployed to:", await router.getAddress());

  // Transfer module ownership to router
  await module.transferOwnership(await router.getAddress());
  console.log("Module ownership transferred to router");

  // Register the module in the router
  const PURCHASE = ethers.encodeBytes32String("purchase");
  await router.setModule(PURCHASE, await module.getAddress());
  console.log("Module registered under 'purchase'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
