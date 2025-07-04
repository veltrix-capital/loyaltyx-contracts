import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with address:", deployer.address);

  // Deploy BaseToken logic contract (used for clones, not initialized)
  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = await BaseToken.deploy(); // no constructor args
  await baseToken.waitForDeployment();

  const baseTokenAddress = await baseToken.getAddress();
  console.log("BaseToken deployed at:", baseTokenAddress);

  // Deploy factory with reference to base token
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy(baseTokenAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("TokenFactory deployed at:", factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
