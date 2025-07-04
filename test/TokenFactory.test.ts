import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, TokenFactory } from "../typechain-types";

describe("TokenFactory", () => {
  let baseToken: BaseToken;
  let factory: TokenFactory;
  let deployer: any;
  let business: any;

  beforeEach(async () => {
    [deployer, business] = await ethers.getSigners();

    // Deploy base token logic contract
    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseTokenInstance = await BaseToken.deploy();
    await baseTokenInstance.waitForDeployment();
    const baseTokenAddress = await baseTokenInstance.getAddress();
    baseToken = await ethers.getContractAt("BaseToken", baseTokenAddress);

    // Deploy TokenFactory with reference to base token
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const factoryInstance = await TokenFactory.deploy(baseTokenAddress);
    await factoryInstance.waitForDeployment();
    const factoryAddress = await factoryInstance.getAddress();
    factory = await ethers.getContractAt("TokenFactory", factoryAddress);
  });

  it("should deploy a token clone for the business", async () => {
    const tx = await factory.connect(business).createToken("BizToken", "BIZ");
    const receipt = await tx.wait();

    const event = receipt?.logs.find((log: any) => log.fragment?.name === "TokenCreated");
    expect(event).to.exist;
    const cloneAddress = event.args?.token;

    expect(cloneAddress).to.properAddress;

    // Check that the token is mapped to the business
    const registered = await factory.getToken(business.address);
    expect(registered).to.equal(cloneAddress);

    // Verify token metadata via ABI
    const token = await ethers.getContractAt("BaseToken", cloneAddress);
    expect(await token.name()).to.equal("BizToken");
    expect(await token.symbol()).to.equal("BIZ");
    expect(await token.owner()).to.equal(business.address);
  });

  it("should not allow same business to create multiple tokens", async () => {
    await factory.connect(business).createToken("First", "FST");

    await expect(
      factory.connect(business).createToken("Second", "SND")
    ).to.be.revertedWith("Token already created");
  });
});
