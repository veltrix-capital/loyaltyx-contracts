import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BaseToken } from "../../typechain-types";

describe("BaseToken", () => {
  let token: BaseToken;
  let owner: any;
  let minter: any;
  let user: any;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();

    const BaseTokenFactory = await ethers.getContractFactory("BaseToken");
    token = (await upgrades.deployProxy(BaseTokenFactory, [
      "Test Token",
      "TST",
      owner.address,
    ], { initializer: "initialize" })) as BaseToken;

    await token.waitForDeployment();
  });

  it("should initialize correctly", async () => {
    expect(await token.name()).to.equal("Test Token");
    expect(await token.symbol()).to.equal("TST");
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.transferable()).to.equal(false);
  });

  it("should allow owner to set minter", async () => {
    await token.setMinter(minter.address, true);
    expect(await token.minters(minter.address)).to.equal(true);
  });

  it("should allow approved minter to mint tokens", async () => {
    await token.setMinter(minter.address, true);
    await token.connect(minter).mint(user.address, 1000);
    expect(await token.balanceOf(user.address)).to.equal(1000);
  });

  it("should not allow unapproved address to mint", async () => {
    await expect(token.connect(user).mint(user.address, 1000)).to.be.revertedWith("Not allowed to mint");
  });

  it("should allow owner to enable transfers", async () => {
    await token.setTransferable(true);
    expect(await token.transferable()).to.equal(true);
  });

  it("should block transfers if not transferable", async () => {
    await token.setMinter(owner.address, true);
    await token.mint(owner.address, 500);

    await expect(token.transfer(user.address, 500)).to.be.revertedWith("Transfers are disabled");
  });

  it("should allow transfers if transferable is true", async () => {
    await token.setMinter(owner.address, true);
    await token.mint(owner.address, 500);
    await token.setTransferable(true);

    await token.transfer(user.address, 500);
    expect(await token.balanceOf(user.address)).to.equal(500);
  });

  it("should allow burning if approved", async () => {
    await token.setMinter(owner.address, true);
    await token.mint(owner.address, 500);
    await token.approve(user.address, 500);

    await token.connect(user).burnFrom(owner.address, 200);
    expect(await token.balanceOf(owner.address)).to.equal(300);
  });
});
