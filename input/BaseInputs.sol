// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {
    CoreStructs
} from "@evvm/testnet-contracts/library/structs/CoreStructs.sol";

abstract contract BaseInputs {
    address admin = 0x3425fF8B2765f3C53ebEa7d28DDb213e0111d5BF;
    address goldenFisher = 0x3425fF8B2765f3C53ebEa7d28DDb213e0111d5BF;
    address activator = 0x3425fF8B2765f3C53ebEa7d28DDb213e0111d5BF;

    CoreStructs.EvvmMetadata inputMetadata =
        CoreStructs.EvvmMetadata({
            EvvmName: "KrumpChain",
            // evvmID will be set to 0, and it will be assigned when you register the evvm
            EvvmID: 0,
            principalTokenName: "KRUMP",
            principalTokenSymbol: "JAB",
            principalTokenAddress: 0x0000000000000000000000000000000000000001,
            totalSupply: 2033333333000000000000000000,
            eraTokens: 1016666666500000000000000000,
            reward: 5000000000000000000
        });
}
