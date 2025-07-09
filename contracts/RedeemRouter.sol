// contracts/RedeemRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract RedeemRouter is Initializable, OwnableUpgradeable {
    mapping(string => address) public modules;

    function initialize(address businessOwner) external initializer {
        __Ownable_init(businessOwner);
    }

    function setModule(string calldata moduleType, address module) external onlyOwner {
        modules[moduleType] = module;
    }

    function handle(string calldata moduleType, bytes calldata data) external {
        address module = modules[moduleType];
        require(module != address(0), "Invalid module");

        (bool success, ) = module.delegatecall(
            abi.encodeWithSignature("handle(bytes)", data)
        );
        if (!success) {
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
}
