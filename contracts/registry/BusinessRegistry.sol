// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IBusinessRegistry.sol";

contract BusinessRegistry is Initializable, Ownable2StepUpgradeable, IBusinessRegistry {

    struct Business {
        string name;
        string metadataURI;
        address owner;
        address token;
        address rewardRouter;
        address redeemRouter;
        mapping(ModuleType => address[]) modules;
    }

    uint256 public nextBusinessId;

    // Business ID => Business Info
    mapping(uint256 => Business) private businesses;

    // For off-chain discovery
    mapping(uint256 => string) public businessNames;
    mapping(uint256 => address) public businessOwners;

    event BusinessRegistered(uint256 indexed businessId, string name, address indexed owner);
    event TokenSet(uint256 indexed businessId, address token);
    event RoutersSet(uint256 indexed businessId, address rewardRouter, address redeemRouter);
    event ModuleAdded(uint256 indexed businessId, ModuleType moduleType, address module);

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function acceptOwnership() public override(Ownable2StepUpgradeable, IBusinessRegistry) {
        super.acceptOwnership();
    }

    function registerBusiness(
        string calldata name,
        string calldata metadataURI,
        address owner_
    ) external onlyOwner returns (uint256 businessId) {
        require(owner_ != address(0), "Invalid business owner");

        businessId = ++nextBusinessId;

        Business storage b = businesses[businessId];
        b.name = name;
        b.metadataURI = metadataURI;
        b.owner = owner_;

        businessNames[businessId] = name;
        businessOwners[businessId] = owner_;

        emit BusinessRegistered(businessId, name, owner_);
    }



    function getBusinessOwner(uint256 businessId) external view returns (address) {
        return businesses[businessId].owner;
    }

    function setBusinessToken(uint256 businessId, address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        businesses[businessId].token = token;
        emit TokenSet(businessId, token);
    }

    function getBusinessToken(uint256 businessId) external view returns (address) {
        return businesses[businessId].token;
    }

    function setBusinessRouters(
        uint256 businessId,
        address rewardRouter,
        address redeemRouter
    ) external onlyOwner {
        businesses[businessId].rewardRouter = rewardRouter;
        businesses[businessId].redeemRouter = redeemRouter;
        emit RoutersSet(businessId, rewardRouter, redeemRouter);
    }

    function getRewardRouter(uint256 businessId) external view returns (address) {
        return businesses[businessId].rewardRouter;
    }

    function getRedeemRouter(uint256 businessId) external view returns (address) {
        return businesses[businessId].redeemRouter;
    }

    function addModuleToBusiness(
        uint256 businessId,
        uint256 moduleType,
        address module
    ) external onlyOwner {
        require(module != address(0), "Invalid module address");
        businesses[businessId].modules[ModuleType(moduleType)].push(module);
        emit ModuleAdded(businessId, ModuleType(moduleType), module);
    }

    function getModules(
        uint256 businessId,
        uint256 moduleType
    ) external view returns (address[] memory) {
        return businesses[businessId].modules[ModuleType(moduleType)];
    }

    function getBusinessInfo(uint256 businessId) external view returns (
        string memory name,
        string memory metadataURI,
        address owner,
        address token,
        address rewardRouter,
        address redeemRouter
    ) {
        Business storage b = businesses[businessId];
        return (
            b.name,
            b.metadataURI,
            b.owner,
            b.token,
            b.rewardRouter,
            b.redeemRouter
        );
    }



}
