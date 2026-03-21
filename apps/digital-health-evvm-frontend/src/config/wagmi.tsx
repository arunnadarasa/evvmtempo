import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { tempoModerato } from "viem/chains";

export const config = createConfig({
  chains: [tempoModerato],
  connectors: [injected()],
  transports: {
    [tempoModerato.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
