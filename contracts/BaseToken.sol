// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BaseToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    OwnableUpgradeable {

    /// @notice Whether transfers are allowed
    bool public transferable;

    /// @notice Mapping of approved minters
    mapping(address => bool) public minters;

    /// @notice Proxy-safe initializer
    function initialize(
        string memory name_,
        string memory symbol_,
        address owner_
    ) public initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Burnable_init();
        __Ownable_init(owner_);
    }

    /// @notice Enables or disables transfers globally
    function setTransferable(bool value) external onlyOwner {
        transferable = value;
    }

    /// @notice Adds or removes a minter address
    function setMinter(address minter, bool allowed) external onlyOwner {
        minters[minter] = allowed;
    }

    /// @notice Mint new tokens to a user
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Not allowed to mint");
        _mint(to, amount);
    }

    /// @dev Hook to control transfers if `transferable` is false
    function _update(address from, address to, uint256 amount)
        internal
        virtual
        override
    {
        if (!transferable) {
            require(from == address(0) || to == address(0), "Transfers are disabled");
        }
        super._update(from, to, amount);
    }
}
