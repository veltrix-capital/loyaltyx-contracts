import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BaseToken } from "../typechain-types";

describe("BaseToken", () => {
  let token: BaseToken;
  let owner: string;
  let user: string;

  beforeEach(async () => {
    const [deployer, other] = await ethers.getSigners();
    owner = deployer.address;
    user = other.address;

    const BaseTokenFactory = await ethers.getContractFactory("BaseToken");
    token = (await upgrades.deployProxy(
      BaseTokenFactory,
      ["LoyaltyToken", "LYT", owner],
      { initializer: "initialize" }
    )) as BaseToken;
  });

  it("initializes with correct name, symbol, and owner", async () => {
    expect(await token.name()).to.equal("LoyaltyToken");
    expect(await token.symbol()).to.equal("LYT");
    expect(await token.owner()).to.equal(owner);
    expect(await token.transferable()).to.equal(false);
  });

  it("allows owner to mint tokens", async () => {
    await token.mint(user, 1000);
    expect(await token.balanceOf(user)).to.equal(1000);
  });

  it("set minter role correctly", async () => {
    const minterRole = await token.MINTER_ROLE();
    expect(await token.hasRole(minterRole, owner)).to.be.true;
  });

  it("grant minter role to another account", async () => {
    const [_, newMinter] = await ethers.getSigners();
    await token.setMinter(newMinter.address, true);
    expect(await token.hasRole(await token.MINTER_ROLE(), newMinter.address)).to.be.true;

    await token.connect(newMinter).mint(user, 500);
    expect(await token.balanceOf(user)).to.equal(500);
  });

  it("prevents non-owner from minting", async () => {
    const [_, nonOwner] = await ethers.getSigners();
    await expect(token.connect(nonOwner).mint(user, 1000))
			.to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
  });

  it("allow transfer for escrow when transferable is false", async () => {    
    await token.mint(owner, 1000);
    await token.setEscrow(user, true);
    await token.transfer(user, 100);
    expect(await token.balanceOf(user)).to.equal(100);
  });

  it("allows transfer only if transferable is true", async () => {
    await token.mint(owner, 500);
    await expect(token.transfer(user, 100)).to.be.revertedWith("Transfers are disabled");

    await token.setTransferable(true);
    await token.transfer(user, 100);
    expect(await token.balanceOf(user)).to.equal(100);
  });

  it("allows burnFrom after approval", async () => {
    await token.mint(user, 1000);
    await token.connect(await ethers.getSigner(user)).approve(owner, 500);
    await token.burnFrom(user, 500);
    expect(await token.balanceOf(user)).to.equal(500);
  });
});
