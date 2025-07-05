import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, RewardRouter, TokenRewardModule, RedeemRouter, TokenBurnRedeemModule } from "../typechain-types";

describe("Full Cycle: Business deploys, rewards, and redeems", function() {
	let owner: any, user: any;
	let token: BaseToken;
	let rewardRouter: RewardRouter;
	let rewardModule: TokenRewardModule;
	let redeemRouter: RedeemRouter;
	let redeemModule: TokenBurnRedeemModule;

	const REWARD_TYPE = ethers.encodeBytes32String("token");
  const REDEEM_TYPE = ethers.encodeBytes32String("token-burn");

	beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // 1. Deploy Business Token
    const TokenFactory = await ethers.getContractFactory("BaseToken", owner);
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
    await token.initialize("BusinessToken", "BZT", owner.address);
    await token.setMinter(owner.address, true);

    // 2. Deploy RewardRouter and TokenRewardModule
    const RewardRouterFactory = await ethers.getContractFactory("RewardRouter", owner);
    rewardRouter = await RewardRouterFactory.deploy();
    await rewardRouter.waitForDeployment();
    await rewardRouter.initialize(owner.address);

    const RewardModuleFactory = await ethers.getContractFactory("TokenRewardModule", owner);
    rewardModule = await RewardModuleFactory.deploy();
    await rewardModule.waitForDeployment();
    await rewardModule.initialize(await token.getAddress(), 2, await rewardRouter.getAddress()); // multiplier = 2

    await rewardRouter.setModule(REWARD_TYPE, await rewardModule.getAddress());
		await token.setMinter(await rewardModule.getAddress(), true);

    // 3. Deploy RedeemRouter and TokenBurnRedeemModule
    const RedeemRouterFactory = await ethers.getContractFactory("RedeemRouter", owner);
    redeemRouter = await RedeemRouterFactory.deploy();
    await redeemRouter.waitForDeployment();
    await redeemRouter.initialize(owner.address);

    const RedeemModuleFactory = await ethers.getContractFactory("TokenBurnRedeemModule", owner);
    redeemModule = await RedeemModuleFactory.deploy();
    await redeemModule.waitForDeployment();
    await redeemModule.initialize(await token.getAddress(), await redeemRouter.getAddress());

    await redeemRouter.setModule(REDEEM_TYPE, await redeemModule.getAddress());
  });

  it("should complete reward and redeem cycle", async () => {
    const value = 100;
    const abi = new ethers.AbiCoder();

    // 4. User gets rewarded
    await rewardRouter.handle(REWARD_TYPE, user.address, value, abi.encode(["string"], ["purchase"]));
    expect(await token.balanceOf(user.address)).to.equal(200); // 100 * 2 multiplier

    // 5. User approves token for redeem
    await token.connect(user).approve(await redeemModule.getAddress(), 200);

    // 6. User redeems
    await redeemRouter.handle(REDEEM_TYPE, user.address, 200, abi.encode(["string"], ["hotel-stay"]));
    expect(await token.balanceOf(user.address)).to.equal(0);
  });
})