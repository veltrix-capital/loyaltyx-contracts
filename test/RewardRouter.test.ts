import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RewardRouter, BaseToken } from "../typechain-types";

describe("RewardRouter", () => {
  let router: RewardRouter;
  let rewardModule: any;
  let baseToken: BaseToken;
  let deployer: any;
  let businessOwner: any;
  let user: any;

  beforeEach(async () => {
    [deployer, businessOwner, user] = await ethers.getSigners();
    // Deploy token
    const TokenFactory = await ethers.getContractFactory("BaseToken");
    baseToken = await upgrades.deployProxy(TokenFactory, ["Token", "TOK", businessOwner.address]);
    // Deploy reward router
    const RouterFactory = await ethers.getContractFactory("RewardRouter");
    router = await RouterFactory.deploy();
    await router.waitForDeployment();
    await router.initialize(businessOwner.address);
    let routerAddress = await router.getAddress();
    await baseToken.connect(businessOwner).setMinter(routerAddress, true);

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
    await expect(router.connect(businessOwner).handle("nft", "0x"))
      .to.be.revertedWithCustomError(router, "ModuleNotFound").withArgs("nft");
  });

  it("should delegatecall to TokenRewardModule and mint tokens", async () => {
    const tokenOwner = await baseToken.owner();
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [baseToken.target, user.address, 1000]
    );

    await router.connect(businessOwner).handle("token", data);

    expect(await baseToken.balanceOf(user.address)).to.equal(1000);
  });
});
