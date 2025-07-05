import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, RedeemRouter, TokenBurnRedeemModule } from "../typechain-types";

describe("RedeemRouter", function () {
  let token: BaseToken;
  let module: TokenBurnRedeemModule;
  let router: RedeemRouter;

  let owner: any;
  let user: any;

  const REDEEM_TYPE = ethers.encodeBytes32String("token-burn");

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy BaseToken
    const TokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const tokenImpl = await TokenFactory.deploy();
    await tokenImpl.waitForDeployment();
    token = await ethers.getContractAt("BaseToken", await tokenImpl.getAddress(), owner);
    await token.initialize("LoyaltyToken", "LTK", owner.address);
    await token.setMinter(owner.address, true);
    await token.mint(user.address, 1000);

    // Deploy RedeemRouter
    const RouterFactory = await ethers.getContractFactory("RedeemRouter", owner);
    const routerImpl = await RouterFactory.deploy();
    await routerImpl.waitForDeployment();
    router = await ethers.getContractAt("RedeemRouter", await routerImpl.getAddress(), owner);
    await router.initialize(owner.address);

    // Deploy TokenBurnRedeemModule with router as owner
    const ModuleFactory = await ethers.getContractFactory(
      "contracts/modules/redeem/TokenBurnRedeemModule.sol:TokenBurnRedeemModule",
      owner
    );
    const moduleImpl = await ModuleFactory.deploy();
    await moduleImpl.waitForDeployment();
    module = await ethers.getContractAt("TokenBurnRedeemModule", await moduleImpl.getAddress(), owner);
    await module.initialize(await token.getAddress(), await router.getAddress());

    // Register module with router
    await router.setModule(REDEEM_TYPE, await module.getAddress());
  });

  it("should route redeem to module and burn tokens", async () => {
    const redeemAmount = 500;
    const abi = new ethers.AbiCoder();
    const rewardType = "hotel-stay";
    const encodedData = abi.encode(["string"], [rewardType]);

    await token.connect(user).approve(await module.getAddress(), redeemAmount);

    await expect(
      router.handle(REDEEM_TYPE, user.address, redeemAmount, encodedData)
    )
      .to.emit(module, "TokenRedeemed")
      .withArgs(user.address, redeemAmount, rewardType);

    expect(await token.balanceOf(user.address)).to.equal(500);
  });

  it("should revert if redeem type is not registered", async () => {
    const fakeType = ethers.encodeBytes32String("coupon");
    await expect(
      router.handle(fakeType, user.address, 100, "0x")
    ).to.be.revertedWith("No module registered");
  });

  it("should only allow owner to call redeem()", async () => {
    await expect(
      router.connect(user).handle(REDEEM_TYPE, user.address, 100, "0x")
    ).to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
  });

  it("should allow replacing redeem module", async () => {
    const newAddr = ethers.ZeroAddress;
    await router.setModule(REDEEM_TYPE, newAddr);
    expect(await router.modules(REDEEM_TYPE)).to.equal(newAddr);
  });
});
