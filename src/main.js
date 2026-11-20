import { createApp } from 'vue';
import App from './App.vue';
import { createEnsResolver } from './ens.mjs';

let resolveEns;

if (window.ethereum) {
    resolveEns = createEnsResolver(window.ethereum);
    try { 
        window.ethereum.enable();
    } catch {
        console.error("User denied account access");
    }
} else if (window.web3) {
    resolveEns = createEnsResolver(window.web3.currentProvider);
} else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
}

const app = createApp(App);

// Share the ENS resolver without loading the Web3/Zod dependency chain.
app.config.globalProperties.$resolveEns = resolveEns;

app.mount('#app');
