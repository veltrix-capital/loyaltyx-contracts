// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces.sol";

/// @notice Shared module. Called via delegatecall from a business RedeemRouter.
contract ValueCouponRedeemModule {
    /// handle payload:
    /// abi.encode(
    ///   address couponClone, // BaseValueCoupon clone
    ///   uint256 tokenId,     // coupon id
    ///   address holder,      // expected owner
    ///   address to           // payout receiver
    /// )
    function handle(bytes calldata data) external {
        (address couponClone, uint256 tokenId, address holder, address to) =
            abi.decode(data, (address, uint256, address, address));

        IValueCoupon(couponClone).redeemTo(tokenId, holder, to);
    }
}
