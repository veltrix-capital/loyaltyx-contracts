// contracts/registry/BusinessRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBusinessRegistry.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract BusinessRegistry is Initializable, OwnableUpgradeable, AccessControlUpgradeable, IBusinessRegistry {
    struct BusinessInfo {
        string name;
        address owner;
        address token;
        address rewardRouter;
        address redeemRouter;
        bool registered;
    }

    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    mapping(address => BusinessInfo) private businesses;

    function initialize(address veltrixOwner) external initializer {
        __Ownable_init(veltrixOwner);
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    function registerBusiness(
        address business,
        string calldata name,
        address owner,
        address token,
        address rewardRouter,
        address redeemRouter
    ) external onlyRole(REGISTRAR_ROLE) {
        require(!businesses[business].registered, "Already registered");
        businesses[business] = BusinessInfo({
            name: name,
            owner: owner,
            token: token,
            rewardRouter: rewardRouter,
            redeemRouter: redeemRouter,
            registered: true
        });
    }

    function isBusiness(address addr) external view override returns (bool) {
        return businesses[addr].registered;
    }

    function getBusinessOwner(address business) external view override returns (address) {
        return businesses[business].owner;
    }

    function getBusinessToken(address business) external view override returns (address) {
        return businesses[business].token;
    }

    function getRewardRouter(address business) external view override returns (address) {
        return businesses[business].rewardRouter;
    }

    function getRedeemRouter(address business) external view override returns (address) {
        return businesses[business].redeemRouter;
    }

    // Optional: human-readable access
    function getBusinessName(address business) external view returns (string memory) {
        return businesses[business].name;
    }
}
