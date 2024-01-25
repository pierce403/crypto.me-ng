import { createApp } from 'vue';
import App from './App.vue';
import Web3 from 'web3';

let web3;

if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try { 
        window.ethereum.enable();
    } catch(e) {
        console.error("User denied account access");
    }
} else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
} else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
}

const app = createApp(App);

// Make web3 available throughout your app
app.config.globalProperties.$web3 = web3;

app.mount('#app');
