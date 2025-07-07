
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BaseToken, TokenRewardModule } from "../../../typechain-types";

describe("TokenRewardModule", () => {
  let token: BaseToken;
  let module: TokenRewardModule;
  let baseTokenImplementation: BaseToken;
  let owner: any;
  let router: any;
  let user: any;

  beforeEach(async () => {
    [owner, router, user] = await ethers.getSigners();

    const BaseTokenFactory = await ethers.getContractFactory("BaseToken");
    token = await BaseTokenFactory.deploy();
    await token.waitForDeployment();
    await token.initialize('My Token', 'MT', owner);
    
    const ModuleFactory = await ethers.getContractFactory("TokenRewardModule");
    module = await ModuleFactory.deploy();
    await module.waitForDeployment();
    await module.initialize(await token.getAddress(), router, owner);
    await token.connect(owner).setMinter(await module.getAddress(), true);
  });

  it("should reward tokens via router", async () => {
    const rewardType = "purchase";
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [rewardType]);

    await module.connect(router).handle(await user.getAddress(), 500, encoded);

    expect(await token.balanceOf(await user.getAddress())).to.equal(500);
  });

  it("should fail if not called by trusted router", async () => {
    const rewardType = "purchase";
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [rewardType]);

    await expect(
      module.connect(user).handle(await user.getAddress(), 500, encoded)
    ).to.be.revertedWith("Unauthorized router");
  });

  it("should fail if value is zero", async () => {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["purchase"]);

    await expect(
      module.connect(router).handle(await user.getAddress(), 0, encoded)
    ).to.be.revertedWith("Zero value");
  });
});
