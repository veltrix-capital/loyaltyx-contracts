// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./interfaces.sol";

contract BaseValueCoupon is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable, 
    IValueCoupon 
{
    using SafeERC20 for IERC20;

    error NotTrustedRouter();
    error InvalidToken();
    error InvalidAmount();
    error NotOwnerOrExpiredGuard();
    error CouponExpired();
    error AlreadyRedeemed();
    error NonTransferable();

    uint256 private _nextId;
    mapping(address => bool) public trustedRouter;
    mapping(uint256 => CouponInfo) private _data;

    /// @notice Clone initializer. Owner should be set to the business.
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address businessOwner
    ) external initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(businessOwner);
        _nextId = 1;
    }

    function setTrustedRouter(address router, bool trusted) external override onlyOwner {
        trustedRouter[router] = trusted;
    }

    function mintAndEscrow(
        address from,
        address to,
        address businessToken,
        uint256 amount,
        uint64 expiry,
        bool transferable_
    ) external override returns (uint256 tokenId) {
        if (!trustedRouter[msg.sender]) revert NotTrustedRouter();
        if (businessToken == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();

        tokenId = _nextId++;
        IERC20(businessToken).safeTransferFrom(from, address(this), amount);

        _safeMint(to, tokenId);
        _data[tokenId] = CouponInfo({
            businessToken: businessToken,
            amount: amount,
            expiry: expiry,
            redeemed: false,
            transferable: transferable_
        });

        emit MintedCoupon(tokenId, to, businessToken, amount, expiry, transferable_);
    }

    function redeemTo(uint256 tokenId, address holder, address to) external override {
        if (!trustedRouter[msg.sender]) revert NotTrustedRouter();
        if (ownerOf(tokenId) != holder) revert NotOwnerOrExpiredGuard();

        CouponInfo storage info = _data[tokenId];
        if (info.redeemed) revert AlreadyRedeemed();
        if (info.expiry != 0 && block.timestamp > info.expiry) revert CouponExpired();

        info.redeemed = true;
        _burn(tokenId);
        IERC20(info.businessToken).safeTransfer(to, info.amount);

        emit RedeemedCoupon(tokenId, holder, to, info.businessToken, info.amount);
    }

    function couponInfo(uint256 tokenId) external view override returns (CouponInfo memory) {
        return _data[tokenId];
    }

    // Enforce per-token transferability (mint/burn always allowed)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        address curOwner = _ownerOf(tokenId);
        bool isMint = curOwner == address(0);
        bool isBurn = to == address(0);

        if(!isMint && !isBurn) {
            if (!_data[tokenId].transferable) revert NonTransferable();
        }
        from = super._update(to, tokenId, auth);
    }
}
