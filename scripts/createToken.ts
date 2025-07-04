import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const factoryAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(factoryAddress);

  const name = "My Hotel Token";
  const symbol = "MHT";

  const tx = await factory.createToken(name, symbol);
  const receipt = await tx.wait();

  // Get the TokenCreated event (parsed)
  const event = receipt?.logs.find((log: any) =>
    log.fragment?.name === "TokenCreated"
  );
  const cloneAddress = event?.args?.token;

  console.log(`Token clone created at: ${cloneAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
