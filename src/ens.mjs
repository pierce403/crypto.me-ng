import { BrowserProvider } from 'ethers';

// Keep support for both EIP-1193 wallets and older injected Web3 providers.
export function adaptProvider(provider) {
  if (typeof provider.request === 'function') return provider;
  const send = provider.sendAsync ?? provider.send;
  if (typeof send !== 'function') throw new Error('Unsupported wallet provider');
  let id = 0;
  return {
    request: ({ method, params = [] }) => new Promise((resolve, reject) => {
      send.call(provider, { jsonrpc: '2.0', id: ++id, method, params }, (error, response) => {
        if (error) return reject(error);
        if (response?.error) return reject(Object.assign(new Error(response.error.message), response.error));
        resolve(response?.result);
      });
    }),
  };
}

export function createEnsResolver(injectedProvider) {
  const provider = new BrowserProvider(adaptProvider(injectedProvider));
  return async (name) => {
    // A name without an address must follow the existing UI's error path.
    const address = await provider.resolveName(name);
    if (!address) throw new Error('ENS name has no address');
    return address;
  };
}
