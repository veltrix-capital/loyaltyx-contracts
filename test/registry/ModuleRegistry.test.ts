import { expect } from "chai";
import { ethers } from "hardhat";
import { BusinessRegistry } from "../../typechain-types";

describe("BusinessRegistry", function () {
  let registry: BusinessRegistry;
  let owner: any, user1: any, user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("BusinessRegistry");
    registry = await Registry.deploy();
    await registry.initialize(owner.address);
  });

  it("should allow a user to register a business", async () => {
    const tx = await registry.connect(user1).registerBusiness("CoffeeShop", "ipfs://metadata1");
    const receipt = await tx.wait();
    const businessId = receipt?.logs[0]?.args?.businessId || 1;

    const business = await registry.businesses(businessId);
    expect(business.owner).to.equal(user1.address);
    expect(business.name).to.equal("CoffeeShop");
  });

  it("should return the owner of a business", async () => {
    const tx = await registry.connect(user1).registerBusiness("Hotel", "ipfs://metadata2");
    const receipt = await tx.wait();
    const businessId = receipt?.logs[0]?.args?.businessId || 1;

    expect(await registry.ownerOf(businessId)).to.equal(user1.address);
  });

  it("should allow business owner to update name", async () => {
    const tx = await registry.connect(user1).registerBusiness("Spa", "ipfs://metadata3");
    const receipt = await tx.wait();
    const businessId = receipt?.logs[0]?.args?.businessId || 1;

    await registry.connect(user1).updateBusinessName(businessId, "LuxurySpa");
    const updated = await registry.businesses(businessId);
    expect(updated.name).to.equal("LuxurySpa");
  });

  it("should allow transfer of business ownership", async () => {
    const tx = await registry.connect(user1).registerBusiness("Resort", "ipfs://metadata4");
    const receipt = await tx.wait();
    const businessId = receipt?.logs[0]?.args?.businessId || 1;

    await registry.connect(user1).transferBusinessOwnership(businessId, user2.address);
    expect(await registry.ownerOf(businessId)).to.equal(user2.address);
  });

  it("should reject updates from non-owners", async () => {
    const tx = await registry.connect(user1).registerBusiness("Gym", "ipfs://metadata5");
    const receipt = await tx.wait();
    const businessId = receipt?.logs[0]?.args?.businessId || 1;

    await expect(
      registry.connect(user2).updateBusinessName(businessId, "NewGym")
    ).to.be.revertedWith("Not business owner");
  });
});
