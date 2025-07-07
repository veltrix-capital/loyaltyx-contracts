// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IRewardModule.sol";

contract RewardRouter is Initializable, OwnableUpgradeable {
    mapping(bytes32 => address) public modules;

    event ModuleSet(bytes32 indexed rewardType, address module);

    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
    }

    function setModule(bytes32 rewardType, address module) external onlyOwner {
        require(module != address(0), "Invalid module");
        modules[rewardType] = module;
        emit ModuleSet(rewardType, module);
    }

    function getModule(bytes32 key) external view returns (address) {
        return modules[key];
    }

    function handle(
        bytes32 rewardType,
        address user,
        uint256 value,
        bytes calldata data
    ) external {
        address module = modules[rewardType];
        require(module != address(0), "Reward module not set");
        IRewardModule(module).handle(user, value, data);
    }
}
