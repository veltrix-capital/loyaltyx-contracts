import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, TokenRewardModule, RewardRouter } from "../typechain-types";

describe("RewardRouter", function () {
  let token: BaseToken;
  let module: TokenRewardModule;
  let router: RewardRouter;
  let owner: any;
  let user: any;

  const PURCHASE = ethers.encodeBytes32String("purchase");

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy and initialize BaseToken
    const TokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const tokenImpl = await TokenFactory.deploy();
    await tokenImpl.waitForDeployment();
    token = await ethers.getContractAt("BaseToken", await tokenImpl.getAddress(), owner);
    await token.initialize("VeltrixToken", "VLTX", owner.address);

    // Deploy and initialize TokenRewardModule
    const ModuleFactory = await ethers.getContractFactory("TokenRewardModule", owner);
    const moduleImpl = await ModuleFactory.deploy();
    await moduleImpl.waitForDeployment();
    module = await ethers.getContractAt("TokenRewardModule", await moduleImpl.getAddress(), owner);
    await module.initialize(await token.getAddress(), 2, owner.address); // multiplier = 2

    // Set module as minter
    await token.setMinter(await module.getAddress(), true);

    // Deploy and initialize RewardRouter
    const RouterFactory = await ethers.getContractFactory("RewardRouter", owner);
    const routerImpl = await RouterFactory.deploy();
    await routerImpl.waitForDeployment();
    router = await ethers.getContractAt("RewardRouter", await routerImpl.getAddress(), owner);
    await router.initialize(owner.address);

    // Transfer ownership of module to router
    await module.transferOwnership(await router.getAddress());

    // Register the module under "purchase"
    await router.setModule(PURCHASE, await module.getAddress());
  });

  it("should register and retrieve a module", async () => {
    const registered = await router.modules(PURCHASE);
    expect(registered).to.equal(await module.getAddress());
  });

  it("should process behavior via registered module", async () => {
    await router.handle(PURCHASE, user.address, 100, "0x");
    expect(await token.balanceOf(user.address)).to.equal(200); // 100 * 2
  });

  it("should revert if no module registered", async () => {
    const VISIT = ethers.encodeBytes32String("visit");
    await expect(
      router.handle(VISIT, user.address, 50, "0x")
    ).to.be.revertedWith("No module registered");
  });

  it("should only allow owner to set module", async () => {
    const VISIT = ethers.encodeBytes32String("visit");
    await expect(
      router.connect(user).setModule(VISIT, module.getAddress())
    ).to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
  });

  it("should only allow owner to call handle", async () => {
    await expect(
      router.connect(user).handle(PURCHASE, user.address, 10, "0x")
    ).to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
  });
});
