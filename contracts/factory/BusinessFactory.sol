// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../modules/Token/BaseToken.sol";
import "../RewardRouter.sol";
import "../RedeemRouter.sol";
import "../registry/BusinessRegistry.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BusinessFactory is Initializable, OwnableUpgradeable {
    using Clones for address;

    address public baseTokenImpl;
    address public rewardRouterImpl;
    address public redeemRouterImpl;
    address public tokenRewardModule;
    address public tokenRedeemModule;
    BusinessRegistry public registry;

    event BusinessCreated(
        address indexed business,
        address owner,
        address token,
        address rewardRouter,
        address redeemRouter
    );

    function initialize(
        address _baseTokenImpl,
        address _rewardRouterImpl,
        address _redeemRouterImpl,
        address _tokenRewardModule,
        address _tokenRedeemModule,
        address _registry,
        address veltrixOwner
    ) external initializer {
        __Ownable_init(veltrixOwner);
        baseTokenImpl = _baseTokenImpl;
        rewardRouterImpl = _rewardRouterImpl;
        redeemRouterImpl = _redeemRouterImpl;
        tokenRewardModule = _tokenRewardModule;
        tokenRedeemModule = _tokenRedeemModule;
        registry = BusinessRegistry(_registry);
    }

    function createBusiness(
        string calldata name,
        address businessOwner,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external onlyOwner returns (address token, address rewardRouter, address redeemRouter) {
        // Clone and initialize BaseToken
        token = baseTokenImpl.clone();
        BaseToken(token).initialize(tokenName, tokenSymbol, address(this));

        // Clone and initialize RewardRouter
        rewardRouter = rewardRouterImpl.clone();
        RewardRouter(rewardRouter).initialize(address(this));
        RewardRouter(rewardRouter).setModule("token", tokenRewardModule);
        RewardRouter(rewardRouter).transferOwnership(businessOwner);
        BaseToken(token).setMinter(rewardRouter, true);
        BaseToken(token).transferOwnership(businessOwner);
        

        // Clone and initialize RedeemRouter
        redeemRouter = redeemRouterImpl.clone();
        RedeemRouter(redeemRouter).initialize(address(this));
        RedeemRouter(redeemRouter).setModule("token", tokenRedeemModule);
        RedeemRouter(redeemRouter).transferOwnership(businessOwner);

        // Use redeem router address as business ID
        address business = redeemRouter;

        // Register in central registry
        registry.registerBusiness(business, name, businessOwner, token, rewardRouter, redeemRouter);

        emit BusinessCreated(business, businessOwner, token, rewardRouter, redeemRouter);
    }
}
