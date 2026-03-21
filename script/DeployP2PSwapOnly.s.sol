// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Script, console2} from "forge-std/Script.sol";
import {P2PSwap} from "@evvm/testnet-contracts/contracts/p2pSwap/P2PSwap.sol";

/**
 * @notice Deploy only `P2PSwap` when `Core` and `Staking` already exist on-chain.
 * @dev Use after a partial deployment (e.g. Tempo) where the final `new P2PSwap` failed.
 *      Set env vars (or add them to `.env` in the project root) before running `forge script`.
 *
 * Required environment variables:
 * - EVVM_P2PSWAP_CORE    — deployed Core contract address
 * - EVVM_P2PSWAP_STAKING — deployed Staking contract address
 * - EVVM_P2PSWAP_OWNER   — P2P swap owner (same role as `admin` in `BaseInputs` / full deploy)
 */
contract DeployP2PSwapOnlyScript is Script {
    /// @dev Forge loads `.env` from the project root; values must be literal hex addresses (42 chars), not `0x...` placeholders or `$VAR` names.
    function _readEnvAddress(string memory name) internal view returns (address) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        if (b.length != 42) {
            revert(
                string.concat(
                    name,
                    ": expected a full address (42 characters: 0x + 40 hex). ",
                    "Put the real Core/Staking addresses from broadcast/.../run-latest.json into .env or export them. ",
                    "Do not use placeholders like 0x... or the text $EVVM_P2PSWAP_CORE."
                )
            );
        }
        if (b[0] != 0x30 || b[1] != 0x78) {
            // 0x
            revert(string.concat(name, ": must start with 0x"));
        }
        return vm.parseAddress(raw);
    }

    function run() public {
        address coreAddr = _readEnvAddress("EVVM_P2PSWAP_CORE");
        address stakingAddr = _readEnvAddress("EVVM_P2PSWAP_STAKING");
        address ownerAddr = _readEnvAddress("EVVM_P2PSWAP_OWNER");

        vm.startBroadcast();
        P2PSwap p2pSwap = new P2PSwap(coreAddr, stakingAddr, ownerAddr);
        vm.stopBroadcast();

        console2.log("P2PSwap deployed at:", address(p2pSwap));
    }
}
