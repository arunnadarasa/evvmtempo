// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Script, console2} from "forge-std/Script.sol";
import {Staking} from "@evvm/testnet-contracts/contracts/staking/Staking.sol";
import {Core} from "@evvm/testnet-contracts/contracts/core/Core.sol";
import {Treasury} from "@evvm/testnet-contracts/contracts/treasury/Treasury.sol";
import {P2PSwap} from "@evvm/testnet-contracts/contracts/p2pSwap/P2PSwap.sol";
import {BaseInputs} from "../input/BaseInputs.sol";

/**
 * @notice Finish `Deploy.s.sol` after a partial deploy when the first `initializeSystemContracts`
 *         (or later steps) failed on Tempo Moderato due to gas under-estimation.
 * @dev Required env vars (same pattern as `DeployP2PSwapOnly.s.sol` — full 42-char hex addresses):
 *      - EVVM_FINALIZE_STAKING
 *      - EVVM_FINALIZE_CORE
 *      - EVVM_FINALIZE_ESTIMATOR
 *      - EVVM_FINALIZE_NAME_SERVICE
 */
contract DeployFinalizeScript is Script, BaseInputs {
    function _readEnvAddress(string memory name) internal view returns (address) {
        string memory raw = vm.envString(name);
        bytes memory b = bytes(raw);
        if (b.length != 42) {
            revert(
                string.concat(
                    name,
                    ": expected 0x + 40 hex). Export from broadcast/.../run-latest.json."
                )
            );
        }
        if (b[0] != 0x30 || b[1] != 0x78) {
            revert(string.concat(name, ": must start with 0x"));
        }
        return vm.parseAddress(raw);
    }

    function run() public {
        address stakingAddr = _readEnvAddress("EVVM_FINALIZE_STAKING");
        address coreAddr = _readEnvAddress("EVVM_FINALIZE_CORE");
        address estimatorAddr = _readEnvAddress("EVVM_FINALIZE_ESTIMATOR");
        address nameServiceAddr = _readEnvAddress("EVVM_FINALIZE_NAME_SERVICE");

        Staking staking = Staking(stakingAddr);
        Core core = Core(coreAddr);

        vm.startBroadcast();

        staking.initializeSystemContracts(estimatorAddr, address(core));
        Treasury treasury = new Treasury(address(core));
        core.initializeSystemContracts(nameServiceAddr, address(treasury));
        P2PSwap p2pSwap = new P2PSwap(address(core), address(staking), admin);

        vm.stopBroadcast();

        console2.log("Treasury deployed at:", address(treasury));
        console2.log("P2PSwap deployed at:", address(p2pSwap));
    }
}
