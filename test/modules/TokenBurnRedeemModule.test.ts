import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, TokenBurnRedeemModule } from "../../typechain-types";

describe("TokenBurnRedeemModule", function () {
  let token: BaseToken;
  let module: TokenBurnRedeemModule;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy and initialize BaseToken
    const TokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const tokenImpl = await TokenFactory.deploy();
    await tokenImpl.waitForDeployment();
    token = await ethers.getContractAt("BaseToken", await tokenImpl.getAddress(), owner);
    await token.initialize("VeltrixToken", "VLTX", owner.address);
    await token.setMinter(owner.address, true);

    // Mint tokens to user
    await token.mint(user.address, 1000);

    // Deploy and initialize TokenBurnRedeemModule
    const ModuleFactory = await ethers.getContractFactory("TokenBurnRedeemModule", owner);
    const moduleImpl = await ModuleFactory.deploy();
    await moduleImpl.waitForDeployment();
    module = await ethers.getContractAt("TokenBurnRedeemModule", await moduleImpl.getAddress(), owner);
    await module.initialize(await token.getAddress(), owner.address);
  });

  it("should burn tokens on redeem", async () => {
    const redeemAmount = 300;
    const rewardType = "hotel-stay";

    const abi = new ethers.AbiCoder();
    const encodedData = abi.encode(["string"], [rewardType]);

    // Approve allowance
    await token.connect(user).approve(await module.getAddress(), redeemAmount);

    // Confirm pre-conditions
    expect(await token.balanceOf(user.address)).to.equal(1000);
    expect(await token.allowance(user.address, await module.getAddress())).to.equal(redeemAmount);

    // Call redeem (as module owner)
    await expect(module.handle(user.address, redeemAmount, encodedData))
      .to.emit(module, "TokenRedeemed")
      .withArgs(user.address, redeemAmount, rewardType);

    // Validate post-conditions
    expect(await token.balanceOf(user.address)).to.equal(700); // 1000 - 300
    expect(await token.allowance(user.address, await module.getAddress())).to.equal(0);
  });

  it("should revert if not enough allowance", async () => {
    await expect(
      module.handle(user.address, 100, ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["fail"]))
    ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
  });

  it("should revert if redeem value is zero", async () => {
    await expect(
      module.handle(user.address, 0, ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["fail"]))
    ).to.be.revertedWith("Zero amount");
  });

  it("should revert if called by non-owner", async () => {
    await token.connect(user).approve(await module.getAddress(), 100);
    await expect(
      module.connect(user).handle(user.address, 100, ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["bad"]))
    ).to.be.revertedWithCustomError(module, "OwnableUnauthorizedAccount");
  });
});
