import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import {
  BusinessRegistry,
  BusinessFactory,
  BaseToken,
  RewardRouter,
  RedeemRouter,
  TokenRewardModule,
  TokenRedeemModule
} from "../typechain-types";

describe("BusinessFactory", function () {
  let factory: BusinessFactory;
  let registry: BusinessRegistry;
  let tokenImpl: BaseToken;
  let rewardRouterImpl: RewardRouter;
  let redeemRouterImpl: RedeemRouter;
  let tokenRewardModuleImpl: TokenRewardModule;
  let tokenRedeemModuleImpl: TokenRedeemModule;
  let owner: Signer;
  let nonOwner: Signer;
  let businessOwner: Signer;

  beforeEach(async () => {
    [owner, nonOwner, businessOwner] = await ethers.getSigners();

    const BusinessRegistryFactory = await ethers.getContractFactory("BusinessRegistry");
    registry = await BusinessRegistryFactory.deploy() as BusinessRegistry;
    await registry.waitForDeployment();
    await registry.initialize(await owner.getAddress());

    const BaseTokenFactory = await ethers.getContractFactory("BaseToken");
    tokenImpl = await BaseTokenFactory.deploy();
    await tokenImpl.waitForDeployment();


    const RewardRouterFactory = await ethers.getContractFactory("RewardRouter");
    rewardRouterImpl = await RewardRouterFactory.deploy();
    await rewardRouterImpl.waitForDeployment();

    const RedeemRouterFactory = await ethers.getContractFactory("RedeemRouter");
    redeemRouterImpl = await RedeemRouterFactory.deploy();
    await redeemRouterImpl.waitForDeployment();

    const TokenRewardModuleFactory = await ethers.getContractFactory("TokenRewardModule");
    tokenRewardModuleImpl = await TokenRewardModuleFactory.deploy();
    await tokenRewardModuleImpl.waitForDeployment();

    const TokenRedeemModuleFactory = await ethers.getContractFactory("TokenRedeemModule");
    tokenRedeemModuleImpl = await TokenRedeemModuleFactory.deploy();
    await tokenRedeemModuleImpl.waitForDeployment();

    const BusinessFactoryFactory = await ethers.getContractFactory("BusinessFactory");
    factory = await upgrades.deployProxy(
      BusinessFactoryFactory,
      [
        await tokenImpl.getAddress(),
        await rewardRouterImpl.getAddress(),
        await redeemRouterImpl.getAddress(),
        await tokenRewardModuleImpl.getAddress(),
        await tokenRedeemModuleImpl.getAddress(),
        await registry.getAddress(),
        await owner.getAddress()
      ],
      { kind: "uups" }
    ) as BusinessFactory;

    await registry.connect(owner).transferOwnership(await factory.getAddress());
    await factory.connect(owner).acceptRegistryOwnership();
  });

  it("should allow only owner to create a business", async () => {
    await expect(
      factory.connect(nonOwner).createBusiness(
        "Test Business",
        "Moonrise Token",
        "MOON",
        "https://logo.uri",
        await businessOwner.getAddress()
      )
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");

    await expect(
      factory.connect(owner).createBusiness(
        "Test Business",
        "Moonrise Token",
        "MOON",
        "https://logo.uri",
        await businessOwner.getAddress()
      )
    ).to.emit(factory, "BusinessCreated");

  });

  it("should create business and register it in registry", async () => {
    const tx = await factory.connect(owner).createBusiness(
      "Test Business",
      "Moonrise Token",
      "MOON",
      "https://logo.uri",
      await businessOwner.getAddress()
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find((e: any) => e.fragment?.name === "BusinessCreated");
    expect(event).to.exist;

    const businessId = event.args.businessId;
    const [name, metadataURI, ownerAddr, token, rewardRouter, redeemRouter] = await registry.getBusinessInfo(businessId);

    expect(name).to.equal("Test Business");
    expect(metadataURI).to.equal("https://logo.uri");
    expect(ownerAddr).to.equal(await businessOwner.getAddress());
    expect(token).to.properAddress;
    expect(rewardRouter).to.properAddress;
    expect(redeemRouter).to.properAddress;
  });

  it("should deploy minimal proxies and transfer ownership", async () => {
    const tx = await factory.connect(owner).createBusiness(
      "Test Business",
      "Moonrise Token",
      "MOON",
      "https://logo.uri",
      await businessOwner.getAddress()
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find((e: any) => e.fragment?.name === "BusinessCreated");
    expect(event).to.exist;

    // Get deployed addresses from event
    const { token, rewardRouter, redeemRouter } = event.args;

    // Get module addresses via router getters
    const rewardRouterContract = await ethers.getContractAt("RewardRouter", rewardRouter);
    const redeemRouterContract = await ethers.getContractAt("RedeemRouter", redeemRouter);

    const rewardModuleAddr = await rewardRouterContract.getModule(
      ethers.keccak256(ethers.toUtf8Bytes("purchase"))
    );
    const redeemModuleAddr = await redeemRouterContract.getModule(
      ethers.keccak256(ethers.toUtf8Bytes("redeem"))
    );

    // Connect to all component contracts
    const tokenContract = await ethers.getContractAt("BaseToken", token);
    const rewardModule = await ethers.getContractAt("TokenRewardModule", rewardModuleAddr);
    const redeemModule = await ethers.getContractAt("TokenRedeemModule", redeemModuleAddr);

    // Assertions
    const businessAddr = await businessOwner.getAddress();
    expect(await tokenContract.owner()).to.equal(businessAddr);
    expect(await rewardRouterContract.owner()).to.equal(businessAddr);
    expect(await redeemRouterContract.owner()).to.equal(businessAddr);
    expect(await rewardModule.owner()).to.equal(businessAddr);
    expect(await redeemModule.owner()).to.equal(businessAddr);
  });

  it("should simulate reward and redeem flow", async () => {
    // Step 1: Create business
    const tx = await factory.connect(owner).createBusiness(
      "Test Business",
      "Moonrise Token",
      "MOON",
      "https://logo.uri",
      await businessOwner.getAddress()
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((e: any) => e.fragment?.name === "BusinessCreated");

    const token = await ethers.getContractAt("BaseToken", event.args.token);
    const rewardRouter = await ethers.getContractAt("RewardRouter", event.args.rewardRouter);
    const redeemRouter = await ethers.getContractAt("RedeemRouter", event.args.redeemRouter);

    const rewardModuleAddr = await rewardRouter.getModule(ethers.keccak256(ethers.toUtf8Bytes("purchase")));
    const redeemModuleAddr = await redeemRouter.getModule(ethers.keccak256(ethers.toUtf8Bytes("redeem")));

    const rewardModule = await ethers.getContractAt("TokenRewardModule", rewardModuleAddr);
    const redeemModule = await ethers.getContractAt("TokenRedeemModule", redeemModuleAddr);

    console.log('-------------- ownership ---------------------');
    console.log('Veltrix: ', await owner.getAddress());
    console.log('BusinessFactory address: ', await factory.getAddress());
    console.log('BusinessFactory owner: ', await factory.owner());
    console.log('registry address: ', await registry.getAddress());
    console.log('registry owner: ', await registry.owner());

    console.log('business Owner: ', await businessOwner.getAddress());
    console.log('rewardRouter address: ', await rewardRouter.owner());
    console.log('rewardRouter owner: ', await rewardRouter.owner());
    console.log('redeemRouter owner: ', await redeemRouter.owner());
    console.log('rewardModule owner: ', await rewardModule.owner());
    let rewardModuleAddress = await rewardModule.getAddress();

    console.log('token owner:', await token.owner());
    console.log('token minters:', await token.minters(rewardModuleAddress));

    // Step 2: Simulate reward
    const userAddr = await nonOwner.getAddress();
    console.log('recepient address: ', userAddr);
    const rewardTypeData = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["purchase"]);
    await rewardRouter.connect(businessOwner).handle(
      ethers.keccak256(ethers.toUtf8Bytes("purchase")),
      userAddr,
      100,
      rewardTypeData
    );

    expect(await token.balanceOf(userAddr)).to.equal(100);

    // Step 3: Simulate redeem
    const redeemTypeData = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["redeem"]);

    // approve business's redeemModule
    await token.connect(nonOwner).approve(redeemModuleAddr, 100);

    await redeemRouter.connect(businessOwner).handle(
      ethers.keccak256(ethers.toUtf8Bytes("redeem")),
      userAddr,
      60,
      redeemTypeData
    );

    expect(await token.balanceOf(userAddr)).to.equal(40);
  });



});
