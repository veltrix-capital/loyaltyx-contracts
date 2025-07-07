import { upgrades, ethers } from "hardhat";
import { ContractFactory, Contract } from "ethers";

/**
 * Deploys an upgradeable contract using OpenZeppelin upgrades plugin.
 *
 * @param name - Name of the contract (must match artifact)
 * @param args - Constructor/initializer arguments
 * @param initializer - Name of the initializer function (default: "initialize")
 * @returns Promise<Contract>
 */
export async function deployUpgradeable<T extends Contract = Contract>(
  name: string,
  args: any[] = [],
  initializer = "initialize"
): Promise<T> {
  const factory: ContractFactory = await ethers.getContractFactory(name);
  const proxy = await upgrades.deployProxy(factory, args, { initializer });
  await proxy.waitForDeployment();
  return proxy as T;
}
