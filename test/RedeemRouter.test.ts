import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  BaseToken,
  RedeemRouter,
  TokenRedeemModule,
} from "../typechain-types";

describe("RedeemRouter", () => {
  let owner: any;
  let user: any;

  let token: BaseToken;
  let router: RedeemRouter;
  let module: TokenRedeemModule;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy base token
    const TokenFactory = await ethers.getContractFactory("BaseToken");
    token = await upgrades.deployProxy(TokenFactory, ["Token", "TOK", owner.address], {
      initializer: "initialize",
    });

    // Mint to user and approve router
    await token.mint(user.address, 1000);

    // Deploy router
    const RouterFactory = await ethers.getContractFactory("RedeemRouter");
    router = await RouterFactory.deploy();
    await router.waitForDeployment();
    await router.initialize(owner.address);

    // Deploy module
    const ModuleFactory = await ethers.getContractFactory("TokenRedeemModule");
    module = await ModuleFactory.deploy();
    await module.waitForDeployment();

    // Register module
    await router.connect(owner).setModule("token", await module.getAddress());

    // User approves router to burn tokens
    await token.connect(user).approve(await router.getAddress(), 500);

    // Transfer token ownership to router so it can check permissions (if needed)
    await token.transferOwnership(await router.getAddress());
  });

  it("should delegatecall to TokenRedeemModule and burn tokens", async () => {
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [await token.getAddress(), user.address, 500]
    );

    await router.connect(user).handle("token", data);

    expect(await token.balanceOf(user.address)).to.equal(500);
  });

  it("should revert if module is not registered", async () => {
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [await token.getAddress(), user.address, 100]
    );

    await expect(
      router.connect(user).handle("unknown", data)
    ).to.be.revertedWith("Invalid module");
  });

  it("should revert if not enough allowance", async () => {
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"],
      [await token.getAddress(), user.address, 1000] // exceeds allowance
    );

    await expect(
      router.connect(user).handle("token", data)
    ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
  });
});
