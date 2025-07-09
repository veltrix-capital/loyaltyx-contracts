import { ethers, upgrades } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  const [deployer, businessOwner] = await ethers.getSigners();

  console.log(`Deploying contracts from: ${deployer.address}`);

  // 1. BaseToken Implementation
  const TokenFactory = await ethers.getContractFactory("BaseToken");
  const tokenImpl = await TokenFactory.deploy();
  await tokenImpl.waitForDeployment();
  console.log(`✅ BaseToken Impl: ${await tokenImpl.getAddress()}`);

  // 2. RewardRouter Implementation
  const RewardRouterFactory = await ethers.getContractFactory("RewardRouter");
  const rewardRouterImpl = await RewardRouterFactory.deploy();
  await rewardRouterImpl.waitForDeployment();
  console.log(`✅ RewardRouter Impl: ${await rewardRouterImpl.getAddress()}`);

  // 3. RedeemRouter Implementation
  const RedeemRouterFactory = await ethers.getContractFactory("RedeemRouter");
  const redeemRouterImpl = await RedeemRouterFactory.deploy();
  await redeemRouterImpl.waitForDeployment();
  console.log(`✅ RedeemRouter Impl: ${await redeemRouterImpl.getAddress()}`);

  // 4. TokenRewardModule
  const TokenRewardModuleFactory = await ethers.getContractFactory("TokenRewardModule");
  const rewardModule = await TokenRewardModuleFactory.deploy();
  await rewardModule.waitForDeployment();
  console.log(`✅ TokenRewardModule: ${await rewardModule.getAddress()}`);

  // 5. TokenRedeemModule
  const TokenRedeemModuleFactory = await ethers.getContractFactory("TokenRedeemModule");
  const redeemModule = await TokenRedeemModuleFactory.deploy();
  await redeemModule.waitForDeployment();
  console.log(`✅ TokenRedeemModule: ${await redeemModule.getAddress()}`);

  // 6. BusinessRegistry
  const RegistryFactory = await ethers.getContractFactory("BusinessRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  await registry.initialize(deployer.address);
  console.log(`✅ BusinessRegistry: ${await registry.getAddress()}`);

  // 7. BusinessFactory
  const BusinessFactoryFactory = await ethers.getContractFactory("BusinessFactory");
  const factory = await BusinessFactoryFactory.deploy();
  await factory.waitForDeployment();

  await factory.initialize(
    await tokenImpl.getAddress(),
    await rewardRouterImpl.getAddress(),
    await redeemRouterImpl.getAddress(),
    await rewardModule.getAddress(),
    await redeemModule.getAddress(),
    await registry.getAddress(),
    deployer.address
  );

  console.log(`✅ BusinessFactory (proxy): ${await factory.getAddress()}`);

  // 8. Grant REGISTRAR_ROLE to factory
  const REGISTRAR_ROLE = ethers.id("REGISTRAR_ROLE");
  await registry.grantRole(REGISTRAR_ROLE, await factory.getAddress());
  console.log(`✅ Granted REGISTRAR_ROLE to BusinessFactory`);

  // 9. Create a test business
  const tx = await factory.createBusiness(
    "Demo Spa",
    businessOwner.address,
    "DemoSpaToken",
    "DST"
  );
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => log.eventName === "BusinessCreated");

  const business = {
    id: event.args?.business,
    token: event.args?.token,
    rewardRouter: event.args?.rewardRouter,
    redeemRouter: event.args?.redeemRouter,
  };

  console.log(`✅ Business created:`);
  console.table(business);

  // Optionally write to file
  writeFileSync("deployments.json", JSON.stringify({
    tokenImpl: await tokenImpl.getAddress(),
    rewardRouterImpl: await rewardRouterImpl.getAddress(),
    redeemRouterImpl: await redeemRouterImpl.getAddress(),
    rewardModule: await rewardModule.getAddress(),
    redeemModule: await redeemModule.getAddress(),
    registry: await registry.getAddress(),
    factory: await factory.getAddress(),
    business
  }, null, 2));

  console.log("📦 All contracts deployed and linked.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
