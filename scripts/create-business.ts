import { ethers } from "hardhat";
import inquirer from "inquirer";
import fs from "fs";

// Update with your deployed factory address
const FACTORY_ADDRESS = "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853";

async function main() {

  const [deployer, businessOwner] = await ethers.getSigners();
  const factory = await ethers.getContractAt("BusinessFactory", FACTORY_ADDRESS, deployer);

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Business name:",
    },
    {
      type: "input",
      name: "tokenName",
      message: "Token name:",
    },
    {
      type: "input",
      name: "tokenSymbol",
      message: "Token symbol:",
    },
    {
      type: "confirm",
      name: "useDefaultOwner",
      message: `Use default business owner (${businessOwner.address})?`,
      default: true,
    },
    {
      type: "input",
      name: "ownerAddress",
      message: "Enter custom business owner address:",
      when: (answers) => !answers.useDefaultOwner,
    },
  ]);

  const ownerAddress = answers.useDefaultOwner ? businessOwner.address : answers.ownerAddress;

  console.log("\nCreating business via factory...");
  const tx = await factory.createBusiness(
    answers.name,
    ownerAddress,
    answers.tokenName,
    answers.tokenSymbol
  );

  const receipt: any = await tx.wait();
  const event = receipt.logs.find((log: any) => log.eventName === "BusinessCreated");

  if (!event) {
    throw new Error("BusinessCreated event not found");
  }

  const business = {
    id: event.args?.business,
    token: event.args?.token,
    rewardRouter: event.args?.rewardRouter,
    redeemRouter: event.args?.redeemRouter,
    owner: ownerAddress,
  };

  console.log("\n✅ Business created:");
  console.table(business);

  fs.appendFileSync("cli/businesses.json", JSON.stringify(business, null, 2) + ",\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
