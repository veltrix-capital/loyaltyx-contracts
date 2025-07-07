// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IRedeemModule.sol";

contract RedeemRouter is Initializable, OwnableUpgradeable {
    mapping(bytes32 => address) public modules;

    event ModuleSet(bytes32 indexed redeemType, address module);
    event Redeemed(bytes32 indexed redeemType, address indexed user, uint256 value);

    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
    }

    function setModule(bytes32 redeemType, address module) external onlyOwner {
        require(module != address(0), "Invalid module");
        modules[redeemType] = module;
        emit ModuleSet(redeemType, module);
    }

    function getModule(bytes32 key) external view returns (address) {
        return modules[key];
    }

    function handle(bytes32 redeemType, address user, uint256 value, bytes calldata data) external onlyOwner {
        address module = modules[redeemType];
        require(module != address(0), "No module registered");

        IRedeemModule(module).handle(user, value, data);
        emit Redeemed(redeemType, user, value);
    }
}
