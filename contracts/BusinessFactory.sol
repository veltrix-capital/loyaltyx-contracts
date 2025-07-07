// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BaseToken.sol";
import "./RewardRouter.sol";
import "./RedeemRouter.sol";
import "./registry/BusinessRegistry.sol";
import "./modules/reward/TokenRewardModule.sol";
import "./modules/redeem/TokenRedeemModule.sol";

import "./interfaces/IBusinessRegistry.sol";

contract BusinessFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    address public baseTokenImplementation;
    address public rewardRouterImplementation;
    address public redeemRouterImplementation;
    address public tokenRewardModuleImplementation;
    address public tokenRedeemModuleImplementation;

    IBusinessRegistry public businessRegistry;

    event BusinessCreated(
        uint256 indexed businessId,
        address indexed owner,
        address token,
        address rewardRouter,
        address redeemRouter,
        address rewardModule,
        address redeemModule
    );

    function initialize(
        address _baseToken,
        address _rewardRouter,
        address _redeemRouter,
        address _tokenRewardModule,
        address _tokenRedeemModule,
        address _businessRegistry,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);

        require(_baseToken != address(0), "Invalid token impl");
        require(_rewardRouter != address(0), "Invalid reward router");
        require(_redeemRouter != address(0), "Invalid redeem router");
        require(_tokenRewardModule != address(0), "Invalid reward module");
        require(_tokenRedeemModule != address(0), "Invalid redeem module");
        require(_businessRegistry != address(0), "Invalid business registry");

        baseTokenImplementation = _baseToken;
        rewardRouterImplementation = _rewardRouter;
        redeemRouterImplementation = _redeemRouter;
        tokenRewardModuleImplementation = _tokenRewardModule;
        tokenRedeemModuleImplementation = _tokenRedeemModule;
        businessRegistry = IBusinessRegistry(_businessRegistry);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function acceptRegistryOwnership() external onlyOwner {
        businessRegistry.acceptOwnership();
    }

    function createBusiness(
        string calldata businessName,
        string calldata tokenName,
        string calldata tokenSymbol,
        string calldata metadataURI,
        address businessOwner
    ) external onlyOwner returns (uint256) {
        require(businessOwner != address(0), "Invalid owner");

        uint256 businessId = businessRegistry.registerBusiness(businessName, metadataURI, businessOwner);

        address token = Clones.clone(baseTokenImplementation);
        BaseToken(token).initialize(tokenName, tokenSymbol, address(this));
        businessRegistry.setBusinessToken(businessId, token);

        address rewardRouter = Clones.clone(rewardRouterImplementation);
        RewardRouter(rewardRouter).initialize(address(this));

        address redeemRouter = Clones.clone(redeemRouterImplementation);
        RedeemRouter(redeemRouter).initialize(address(this));

        businessRegistry.setBusinessRouters(businessId, rewardRouter, redeemRouter);

        address rewardModule = Clones.clone(tokenRewardModuleImplementation);
        TokenRewardModule(rewardModule).initialize(token, rewardRouter, address(this));

        address redeemModule = Clones.clone(tokenRedeemModuleImplementation);
        TokenRedeemModule(redeemModule).initialize(token, redeemRouter, address(this));

        RewardRouter(rewardRouter).setModule(keccak256("purchase"), rewardModule);
        RedeemRouter(redeemRouter).setModule(keccak256("redeem"), redeemModule);

        BaseToken(token).setMinter(rewardModule, true);
        
        BaseToken(token).transferOwnership(businessOwner);
        RewardRouter(rewardRouter).transferOwnership(businessOwner);
        RedeemRouter(redeemRouter).transferOwnership(businessOwner);
        TokenRewardModule(rewardModule).transferOwnership(businessOwner);
        TokenRedeemModule(redeemModule).transferOwnership(businessOwner);


        // 6. Register modules in BusinessRegistry
        businessRegistry.addModuleToBusiness(
            businessId,
            uint256(IBusinessRegistry.ModuleType.REWARD),
            rewardModule
        );

        businessRegistry.addModuleToBusiness(
            businessId,
            uint256(IBusinessRegistry.ModuleType.REDEEM),
            redeemModule
        );

        emit BusinessCreated(
            businessId,
            businessOwner,
            token,
            rewardRouter,
            redeemRouter,
            rewardModule,
            redeemModule
        );

        return businessId;
    }
}
