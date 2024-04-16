// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BaseToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    OwnableUpgradeable, 
    AccessControlUpgradeable 
{
    bool public transferable;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(address => bool) public trustedEscrow;

    event TransferableStatusChanged(bool allowed);
    event MinterRoleChanged(address indexed account, bool enabled);
    event EscrowTrustUpdated(address indexed escrow, bool trusted);

    function initialize(
        string memory name_, 
        string memory symbol_, 
        address businessOwner
    ) external initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Burnable_init();
        __Ownable_init(businessOwner);
        __AccessControl_init();

        transferable = false;

        _grantRole(DEFAULT_ADMIN_ROLE, businessOwner);
        _grantRole(MINTER_ROLE, businessOwner);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function setMinter(address account, bool enabled) external onlyOwner {
        if (enabled) {
            _grantRole(MINTER_ROLE, account);
        } else {
            _revokeRole(MINTER_ROLE, account);
        }
        emit MinterRoleChanged(account, enabled);
    }

    function setEscrow(address escrow, bool trusted) external onlyOwner {
        trustedEscrow[escrow] = trusted;
        emit EscrowTrustUpdated(escrow, trusted);
    }

    function setTransferable(bool allowed) external onlyOwner {
        transferable = allowed;
        emit TransferableStatusChanged(allowed);
    }

    function _update(address from, address to, uint256 amount)
        internal
        virtual
        override
    {
        if (!transferable) {
            bool isMintOrBurn = (from == address(0) || to == address(0));
            bool touchesEscrow = trustedEscrow[from] || trustedEscrow[to];
            require(isMintOrBurn || touchesEscrow, "Transfers are disabled");
        }
        super._update(from, to, amount);
    }
}
