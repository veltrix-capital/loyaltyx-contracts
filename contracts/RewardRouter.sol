// contracts/RewardRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract RewardRouter is Initializable, OwnableUpgradeable, AccessControlUpgradeable {

    bytes32 public constant HANDLER_ROLE = keccak256("HANDLER_ROLE");

    mapping(string => address) public modules;

    error ModuleAlreadyExists(string moduleType);
    error ModuleNotFound(string moduleType);
    error SameModule();

    event ModuleSet(string indexed moduleType, address indexed module);
    event ModuleRemoved(string indexed moduleType, address indexed oldModule);
    event ModuleReplaced(string indexed moduleType, address indexed oldModule, address indexed newModule);
    event HandlerSet(address indexed account, bool allowed);
    event Handled(string indexed moduleType, bytes data);

    function initialize(address businessOwner) external initializer {
        __Ownable_init(businessOwner);
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, businessOwner);
        _grantRole(HANDLER_ROLE, businessOwner);
    }

    function setModule(string calldata moduleType, address module) external onlyOwner {
        if (modules[moduleType] != address(0)) {
            revert ModuleAlreadyExists(moduleType);
        }
        modules[moduleType] = module;
        emit ModuleSet(moduleType, module);
    }

    function removeModule(string calldata moduleType) external onlyOwner {
        address old = modules[moduleType];
        if (old == address(0)) {
            revert ModuleNotFound(moduleType);
        }
        delete modules[moduleType];
        emit ModuleRemoved(moduleType, old);
    }

    function replaceModule(string calldata moduleType, address newModule) external onlyOwner {
        address old = modules[moduleType];
        if (old == address(0)) {
            revert ModuleNotFound(moduleType);
        }
        if (old == newModule) {
            revert SameModule();
        }
        modules[moduleType] = newModule;
        emit ModuleReplaced(moduleType, old, newModule);
    }

    function getModule(string calldata moduleType) external view returns (address) {
        address module = modules[moduleType];
        if (module == address(0)) {
            revert ModuleNotFound(moduleType);
        }
        return module;
    }

    function setHandler(address account, bool allowed) external onlyOwner {
        if (allowed) {
            _grantRole(HANDLER_ROLE, account);
        } else {
            _revokeRole(HANDLER_ROLE, account);
        }
        emit HandlerSet(account, allowed);
    }

    function handle(string calldata moduleType, bytes calldata data) external onlyRole(HANDLER_ROLE) {
        address module = modules[moduleType];
        if (module == address(0)) {
            revert ModuleNotFound(moduleType);
        }

        (bool success, ) = module.delegatecall(
            abi.encodeWithSignature("handle(bytes)", data)
        );

        if (!success) {
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        emit Handled(moduleType, data);
    }
}
