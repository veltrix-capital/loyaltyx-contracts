// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IBusinessRegistry } from "../interfaces/IBusinessRegistry.sol";

contract ModuleRegistry {
    enum ModuleType {
        REWARD,
        REDEEM,
        SWAP,
        KYC,
        DAO,
        DISCOUNT,
        ANALYTICS
    }

    struct ModuleInfo {
        ModuleType moduleType;
        string name;
        string version;
        string metadataURI;
        address implementation;
        bool active;
    }

    struct ModuleAccess {
        bool assigned;
        bool enabled;
        uint256 expiresAt;
    }

    address public owner;
    IBusinessRegistry public businessRegistry;

    uint256 public nextModuleId;
    mapping(uint256 => ModuleInfo) public modules;
    mapping(address => uint256) public moduleIdByAddress;
    mapping(uint256 => mapping(uint256 => ModuleAccess)) public businessToModules;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not registry owner");
        _;
    }

    modifier onlyBusinessOwner(uint256 businessId) {
        require(msg.sender == businessRegistry.ownerOf(businessId), "Not business owner");
        _;
    }

    event ModuleRegistered(uint256 indexed moduleId, string name, ModuleType moduleType, address implementation);
    event ModuleAssigned(uint256 indexed businessId, uint256 indexed moduleId, uint256 expiresAt);
    event ModuleEnabled(uint256 indexed businessId, uint256 indexed moduleId);
    event ModuleDisabled(uint256 indexed businessId, uint256 indexed moduleId);
    event ModuleSubscriptionExtended(uint256 indexed businessId, uint256 indexed moduleId, uint256 newExpiresAt);

    constructor(address _businessRegistry) {
        require(_businessRegistry != address(0), "Invalid registry");
        owner = msg.sender;
        businessRegistry = IBusinessRegistry(_businessRegistry);
    }

    function registerModule(
        string calldata name,
        ModuleType moduleType,
        address implementation,
        string calldata version,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        require(implementation != address(0), "Invalid address");
        require(moduleIdByAddress[implementation] == 0, "Module already registered");

        uint256 id = ++nextModuleId;
        modules[id] = ModuleInfo({
            name: name,
            moduleType: moduleType,
            version: version,
            metadataURI: metadataURI,
            implementation: implementation,
            active: true
        });

        moduleIdByAddress[implementation] = id;

        emit ModuleRegistered(id, name, moduleType, implementation);
        return id;
    }

    function assignModuleToBusiness(uint256 businessId, uint256 moduleId, uint256 initialExpiresAt) external onlyOwner {
        require(modules[moduleId].active, "Inactive module");
        businessToModules[businessId][moduleId] = ModuleAccess({
            assigned: true,
            enabled: true,
            expiresAt: initialExpiresAt
        });
        emit ModuleAssigned(businessId, moduleId, initialExpiresAt);
    }

    function extendModuleSubscription(uint256 businessId, uint256 moduleId, uint256 newExpiresAt) external onlyOwner {
        require(businessToModules[businessId][moduleId].assigned, "Not assigned");
        businessToModules[businessId][moduleId].expiresAt = newExpiresAt;
        emit ModuleSubscriptionExtended(businessId, moduleId, newExpiresAt);
    }

    function enableModuleForBusiness(uint256 businessId, uint256 moduleId) external onlyBusinessOwner(businessId) {
        require(businessToModules[businessId][moduleId].assigned, "Module not assigned");
        businessToModules[businessId][moduleId].enabled = true;
        emit ModuleEnabled(businessId, moduleId);
    }

    function disableModuleForBusiness(uint256 businessId, uint256 moduleId) external onlyBusinessOwner(businessId) {
        require(businessToModules[businessId][moduleId].assigned, "Module not assigned");
        businessToModules[businessId][moduleId].enabled = false;
        emit ModuleDisabled(businessId, moduleId);
    }

    function isModuleEnabled(uint256 businessId, uint256 moduleId) external view returns (bool) {
        return businessToModules[businessId][moduleId].enabled;
    }

    function getModuleAccess(uint256 businessId, uint256 moduleId) external view returns (ModuleAccess memory) {
        return businessToModules[businessId][moduleId];
    }
}
