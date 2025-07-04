import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken, TokenRewardModule } from "../../typechain-types";

describe("TokenRewardModule", function () {
  let token: BaseToken;
  let module: TokenRewardModule;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const tokenImpl = await TokenFactory.deploy();
    await tokenImpl.waitForDeployment();

    token = await ethers.getContractAt("BaseToken", await tokenImpl.getAddress(), owner);
    await token.initialize("VeltrixToken", "VLTX", owner.address);

    const ModuleFactory = await ethers.getContractFactory("TokenRewardModule", owner);
    const moduleImpl = await ModuleFactory.deploy();
    await moduleImpl.waitForDeployment();

    module = await ethers.getContractAt("TokenRewardModule", await moduleImpl.getAddress(), owner);
    await module.initialize(await token.getAddress(), 5, owner.address); // multiplier = 5

    await token.setMinter(await module.getAddress(), true);
  });

  it("should initialize correctly", async () => {
    expect(await module.token()).to.equal(await token.getAddress());
    expect(await module.multiplier()).to.equal(5);
    expect(await module.owner()).to.equal(owner.address);
  });

  it("should update multiplier", async () => {
    await module.setMultiplier(10);
    expect(await module.multiplier()).to.equal(10);
  });

  it("should mint tokens based on multiplier", async () => {
    await module.handle(user.address, 100, "0x");
    expect(await token.balanceOf(user.address)).to.equal(500); // 100 * 5
  });

  it("should revert if non-owner calls handle", async () => {
    await expect(
      module.connect(user).handle(user.address, 100, "0x")
    ).to.be.revertedWithCustomError(module, "OwnableUnauthorizedAccount");
  });

  it("should revert if module is not a minter", async () => {
    const [_, __, tempUser] = await ethers.getSigners();
    const badTokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const badTokenImpl = await badTokenFactory.deploy();
    await badTokenImpl.waitForDeployment();
    const badToken = await ethers.getContractAt("BaseToken", await badTokenImpl.getAddress(), owner);
    await badToken.initialize("BadToken", "BAD", owner.address);

    const badModuleFactory = await ethers.getContractFactory("TokenRewardModule", owner);
    const badModuleImpl = await badModuleFactory.deploy();
    await badModuleImpl.waitForDeployment();
    const badModule = await ethers.getContractAt("TokenRewardModule", await badModuleImpl.getAddress(), owner);
    await badModule.initialize(await badToken.getAddress(), 2, owner.address);

    await expect(
      badModule.handle(tempUser.address, 100, "0x")
    ).to.be.revertedWith("Not allowed to mint");
  });
});
