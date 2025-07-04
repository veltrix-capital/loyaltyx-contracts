import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseToken } from "../typechain-types";

describe("BaseToken (clean version)", function () {
  let token: BaseToken;
  let owner: any;
  let minter: any;
  let user: any;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();

    const BaseTokenFactory = await ethers.getContractFactory("BaseToken", owner);
    const deployed = await BaseTokenFactory.deploy();
    await deployed.waitForDeployment();

    token = await ethers.getContractAt("BaseToken", await deployed.getAddress(), owner);
    await token.initialize("VeltrixToken", "VLTX", owner.address);
  });

  it("should initialize correctly", async () => {
    expect(await token.name()).to.equal("VeltrixToken");
    expect(await token.symbol()).to.equal("VLTX");
    expect(await token.owner()).to.equal(owner.address);
  });

  it("should set and respect transferable flag", async () => {
    await token.setTransferable(true);
    expect(await token.transferable()).to.equal(true);

    await token.setTransferable(false);
    expect(await token.transferable()).to.equal(false);
  });

  it("should allow setting a minter", async () => {
    await token.setMinter(minter.address, true);
    expect(await token.minters(minter.address)).to.equal(true);
  });

  it("should allow minter to mint", async () => {
    await token.setMinter(minter.address, true);
    await token.connect(minter).mint(user.address, 1000);
    expect(await token.balanceOf(user.address)).to.equal(1000);
  });

  it("should reject minting by non-minter", async () => {
    await expect(token.connect(user).mint(user.address, 1000)).to.be.revertedWith("Not allowed to mint");
  });

  it("should block transfers if transferable is false", async () => {
    await token.setMinter(owner.address, true);
    await token.mint(owner.address, 500);
    await expect(token.transfer(user.address, 200)).to.be.revertedWith("Transfers are disabled");
  });

  it("should allow transfers if transferable is true", async () => {
    await token.setMinter(owner.address, true);
    await token.setTransferable(true);
    await token.mint(owner.address, 500);
    await token.transfer(user.address, 200);
    expect(await token.balanceOf(user.address)).to.equal(200);
  });
});
