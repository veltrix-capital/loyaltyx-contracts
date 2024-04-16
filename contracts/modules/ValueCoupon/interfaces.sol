// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IValueCoupon {
    struct CouponInfo {
        address businessToken;   // ERC20 escrowed
        uint256 amount;          // amount escrowed
        uint64  expiry;          // 0 = no expiry
        bool    redeemed;        // redeemed flag
        bool    transferable;    // transferable flag
    }

    function mintAndEscrow(
        address from,
        address to,
        address businessToken,
        uint256 amount,
        uint64 expiry,
        bool transferable
    ) external returns (uint256 tokenId);

    function redeemTo(uint256 tokenId, address holder, address to) external;

    function couponInfo(uint256 tokenId) external view returns (CouponInfo memory);

    function setTrustedRouter(address router, bool trusted) external;

    event MintedCoupon(
        uint256 indexed tokenId,
        address indexed to,
        address indexed businessToken,
        uint256 amount,
        uint64 expiry,
        bool transferable
    );

    event RedeemedCoupon(
        uint256 indexed tokenId,
        address indexed holder,
        address indexed to,
        address businessToken,
        uint256 amount
    );
}
