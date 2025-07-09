import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RewardRouter, BaseToken } from "../typechain-types";

describe("RewardRouter", () => {
  let router: RewardRouter;
  let rewardModule: any;
  let baseToken: BaseToken;
  let businessOwner: any;
  let user: any;

  beforeEach(async () => {
    [businessOwner, user] = await ethers.getSigners();
    
    // Deploy token
    const TokenFactory = await ethers.getContractFactory("BaseToken");
    baseToken = await upgrades.deployProxy(TokenFactory, ["Token", "TOK", businessOwner.address]);
    
    // Deploy reward router
    const RouterFactory = await ethers.getContractFactory("RewardRouter");
    router = await RouterFactory.deploy();
    await router.waitForDeployment();
    await router.initialize(businessOwner.address);
   
    await baseToken.transferOwnership(await router.getAddress());
    
    // Deploy TokenRewardModule
    const ModuleFactory = await ethers.getContractFactory("TokenRewardModule");
    rewardModule = await ModuleFactory.deploy();
    await rewardModule.waitForDeployment();

    // Register "token" module
    await router.connect(businessOwner).setModule("token", await rewardModule.getAddress());
  });

  it("should reject setModule from non-owner", async () => {
    await expect(
      router.connect(user).setModule("token", await rewardModule.getAddress())
    ).to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
  });

  it("should reject handle() with unregistered moduleType", async () => {
    await expect(router.handle("nft", "0x")).to.be.revertedWith("Invalid module");
  });

  it("should delegatecall to TokenRewardModule and mint tokens", async () => {
    const tokenOwner = await baseToken.owner();
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [baseToken.target, user.address, 1000]
    );

    await router.handle("token", data);

    expect(await baseToken.balanceOf(user.address)).to.equal(1000);
  });
});
