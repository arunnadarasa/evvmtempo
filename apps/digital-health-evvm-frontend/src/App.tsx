import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wagmi";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { EVVMSection } from "./components/sections/EVVMSection";
import { NameServiceSection } from "./components/sections/NameServiceSection";
import { StakingSection } from "./components/sections/StakingSection";
import { ExplainerSection } from "./components/sections/ExplainerSection";
import { OpenClawMriSection } from "./components/sections/OpenClawMriSection";
import { RecentTransactionsSection } from "./components/sections/RecentTransactionsSection";
import "./App.css";
import { CHAIN_INFRA_NAME, CHAIN_ID, NETWORK_DISPLAY_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "./config/contracts";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <div className="app">
            <Header />
            <main className="main">
              <p className="hackathon-intro">
                EVVM UI for <strong>{NETWORK_DISPLAY_NAME}</strong> on <strong>{CHAIN_INFRA_NAME}</strong> (chain{" "}
                <strong>{CHAIN_ID}</strong>). Principal token: <strong>{TOKEN_NAME}</strong> (<strong>{TOKEN_SYMBOL}</strong>)
                — use the faucet in EVVM Core to fund tests.
              </p>
              <p className="disclaimer">
                This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or
                government body.
              </p>
              <ExplainerSection />
              <OpenClawMriSection />
              <RecentTransactionsSection />
              <EVVMSection />
              <NameServiceSection />
              <StakingSection />
            </main>
          </div>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
