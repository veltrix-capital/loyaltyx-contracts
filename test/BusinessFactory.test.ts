import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  BusinessFactory,
  BusinessRegistry,
  BaseToken,
  RewardRouter,
  RedeemRouter,
} from "../typechain-types";

describe("BusinessFactory", () => {
  let deployer: any;
  let businessOwner: any;
  let user: any;
  let user2: any;
  let registry: BusinessRegistry;
  let factory: BusinessFactory;
  let tokenImpl: any;
  let rewardRouterImpl: any;
  let redeemRouterImpl: any;
  const REGISTRAR_ROLE = ethers.id("REGISTRAR_ROLE"); // keccak256

  beforeEach(async () => {
    [deployer, businessOwner, user, user2] = await ethers.getSigners();

    // Deploy registry
    const RegistryFactory = await ethers.getContractFactory("BusinessRegistry");
    registry = await RegistryFactory.deploy();
    await registry.initialize(deployer.address);

    // Deploy implementations
    const TokenFactory = await ethers.getContractFactory("BaseToken");
    tokenImpl = await TokenFactory.deploy();
    await tokenImpl.waitForDeployment();

    const RewardRouterFactory = await ethers.getContractFactory("RewardRouter");
    rewardRouterImpl = await RewardRouterFactory.deploy();
    await rewardRouterImpl.waitForDeployment();

    const RedeemRouterFactory = await ethers.getContractFactory("RedeemRouter");
    redeemRouterImpl = await RedeemRouterFactory.deploy();
    await redeemRouterImpl.waitForDeployment();

    const TokenRewardModuleFactory = await ethers.getContractFactory(
      "TokenRewardModule"
    );
    const rewardModule = await TokenRewardModuleFactory.deploy();
    await rewardModule.waitForDeployment();

    const TokenRedeemModuleFactory = await ethers.getContractFactory(
      "TokenRedeemModule"
    );
    const redeemModule = await TokenRedeemModuleFactory.deploy();
    await redeemModule.waitForDeployment();

    // Deploy factory
    const FactoryFactory = await ethers.getContractFactory("BusinessFactory");
    factory = await FactoryFactory.deploy();
    await factory.waitForDeployment();

    await factory.initialize(
      await tokenImpl.getAddress(),
      await rewardRouterImpl.getAddress(),
      await redeemRouterImpl.getAddress(),
      await rewardModule.getAddress(),
      await redeemModule.getAddress(),
      await registry.getAddress(),
      deployer.address
    );

    await registry.grantRole(REGISTRAR_ROLE, await factory.getAddress());
  });

  it("should create a new business with routers and token", async () => {
    const tx = await factory
      .connect(deployer)
      .createBusiness(
        "Pizza Palace",
        businessOwner.address,
        "Pizza Palace token",
        "PPT"
      );
    const receipt = await tx.wait();
    const event = receipt?.logs?.find(
      (log: any) => log.eventName === "BusinessCreated"
    );

    const businessAddress = event?.args?.business;
    const rewardRouterAddr = event?.args?.rewardRouter;
    const redeemRouterAddr = event?.args?.redeemRouter;
    const tokenAddr = event?.args?.token;

    // Check registry
    expect(businessAddress).to.equal(redeemRouterAddr);
    expect(await registry.getBusinessOwner(businessAddress)).to.equal(
      businessOwner.address
    );
    expect(await registry.getBusinessName(businessAddress)).to.equal(
      "Pizza Palace"
    );
    expect(await registry.getBusinessToken(businessAddress)).to.equal(
      tokenAddr
    );
    expect(await registry.getRewardRouter(businessAddress)).to.equal(
      rewardRouterAddr
    );
    expect(await registry.getRedeemRouter(businessAddress)).to.equal(
      redeemRouterAddr
    );

    // Check token ownership
    const Token = await ethers.getContractFactory("BaseToken");
    const token = Token.attach(tokenAddr);
    expect(await token.owner()).to.equal(businessOwner.address);

    // check if Business RewardRouter is set as minter
    expect(await token.hasRole(await token.MINTER_ROLE(), rewardRouterAddr)).to
      .be.true;

    // Check routers initialized
    const Router = await ethers.getContractFactory("RewardRouter");
    const rewardRouter = Router.attach(rewardRouterAddr);
    expect(await rewardRouter.owner()).to.equal(businessOwner.address);
  });

  it("should prevent non-deployer from creating business", async () => {
    await expect(
      factory
        .connect(businessOwner)
        .createBusiness("Fake Store", businessOwner.address, "Fake Token", "FT")
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });

  // simulate reward / redeem flow
  it("should reward tokens to user and then redeem them", async () => {
    const tx = await factory
      .connect(deployer)
      .createBusiness(
        "Burger House",
        businessOwner.address,
        "BurgerToken",
        "BTK"
      );

    const receipt = await tx.wait();
    const event = receipt?.logs?.find(
      (log: any) => log.eventName === "BusinessCreated"
    );

    const tokenAddr = event.args?.token;
    const rewardRouterAddr = event.args?.rewardRouter;
    const redeemRouterAddr = event.args?.redeemRouter;

    const token = await ethers.getContractAt("BaseToken", tokenAddr);
    const rewardRouter = await ethers.getContractAt(
      "RewardRouter",
      rewardRouterAddr
    );
    const redeemRouter = await ethers.getContractAt(
      "RedeemRouter",
      redeemRouterAddr
    );

    // Step 2: Reward user (businessOwner triggers reward logic)

    const rewardData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [await token.getAddress(), user.address, 100]
    );

    // get random account to set as handler
    const user3 = (await ethers.getSigners())[10];
    await rewardRouter.connect(businessOwner).setHandler(user2.address, true);
    await rewardRouter.connect(businessOwner).setHandler(user3.address, true);
    // check if handler is set
    expect(
      await rewardRouter.hasRole(
        await rewardRouter.HANDLER_ROLE(),
        user2.address
      )
    ).to.be.true;
    expect(
      await rewardRouter.hasRole(
        await rewardRouter.HANDLER_ROLE(),
        user3.address
      )
    ).to.be.true;
    await rewardRouter.connect(user2).handle("token", rewardData);
    await rewardRouter.connect(user3).handle("token", rewardData);

    expect(await token.balanceOf(user.address)).to.equal(200);

    // Step 3: Redeem tokens (user triggers redeem logic)

    const redeemData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [await token.getAddress(), user.address, 100]
    );

    await token.connect(user).approve(redeemRouterAddr, 100);

    await redeemRouter.connect(businessOwner).setHandler(user2.address, true);
    await redeemRouter.connect(user2).handle("token", redeemData);

    const finalBalance = await token.balanceOf(user.address);
    expect(finalBalance).to.equal(100);
  });
});
