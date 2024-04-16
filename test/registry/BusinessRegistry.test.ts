import { expect } from "chai";
import { ethers } from "hardhat";
import { BusinessRegistry } from "../../typechain-types";

describe("BusinessRegistry", () => {
  let registry: BusinessRegistry;
  let superDeployer: any;
  let businessOwner: any;
  let dummyToken: string;
  let dummyRewardRouter: string;
  let dummyRedeemRouter: string;

  beforeEach(async () => {
    [superDeployer, businessOwner] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("BusinessRegistry");
    registry = await RegistryFactory.deploy();
    await registry.initialize(superDeployer.address);

    // Dummy addresses for test purposes
    dummyToken = ethers.Wallet.createRandom().address;
    dummyRewardRouter = ethers.Wallet.createRandom().address;
    dummyRedeemRouter = ethers.Wallet.createRandom().address;
  });

  it("should register a new business correctly", async () => {
    const name = "CoffeeClub";
    const business = dummyRedeemRouter;

    await registry.registerBusiness(
      business,
      name,
      businessOwner.address,
      dummyToken,
      dummyRewardRouter,
      dummyRedeemRouter
    );

    expect(await registry.isBusiness(business)).to.equal(true);
    expect(await registry.getBusinessOwner(business)).to.equal(businessOwner.address);
    expect(await registry.getBusinessToken(business)).to.equal(dummyToken);
    expect(await registry.getRewardRouter(business)).to.equal(dummyRewardRouter);
    expect(await registry.getRedeemRouter(business)).to.equal(dummyRedeemRouter);
    expect(await registry.getBusinessName(business)).to.equal(name);
  });

  it("should reject registration from non-owner", async () => {
    await expect(
      registry.connect(businessOwner).registerBusiness(
        dummyRedeemRouter,
        "Unauthorized",
        businessOwner.address,
        dummyToken,
        dummyRewardRouter,
        dummyRedeemRouter
      )
    ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
  });

  it("should reject duplicate business registration", async () => {
    const business = dummyRedeemRouter;

    await registry.registerBusiness(
      business,
      "ShopOne",
      businessOwner.address,
      dummyToken,
      dummyRewardRouter,
      dummyRedeemRouter
    );

    await expect(
      registry.registerBusiness(
        business,
        "ShopOneAgain",
        businessOwner.address,
        dummyToken,
        dummyRewardRouter,
        dummyRedeemRouter
      )
    ).to.be.revertedWithCustomError(registry, "BusinessAlreadyRegistered").withArgs(business);
  });
});
