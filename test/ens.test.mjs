import test from 'node:test';
import assert from 'node:assert/strict';
import { Interface, ZeroAddress, namehash } from 'ethers';
import { adaptProvider, createEnsResolver } from '../src/ens.mjs';

const resolverAddress = '0x1111111111111111111111111111111111111111';
const target = '0x2222222222222222222222222222222222222222';
const abi = new Interface(['function requireResolver(bytes) view returns ((bytes name, uint256 offset, bytes32 node, address resolver, bool extended))', 'function resolver(bytes32) view returns (address)', 'function supportsInterface(bytes4) view returns (bool)', 'function addr(bytes32) view returns (address)']);
function wallet({ address = target, chain = '0x1', fail = false } = {}) {
  const calls = [];
  return { calls, async request({ method, params }) {
    calls.push({ method, params });
    if (method === 'eth_chainId') return chain;
    if (method !== 'eth_call') throw new Error(`Unexpected method ${method}`);
    if (fail) throw new Error('Wallet unavailable');
    const parsed = abi.parseTransaction({ data: params[0].data });
    if (parsed.name === 'requireResolver') return abi.encodeFunctionResult(parsed.name, [[parsed.args[0], 0, namehash('example.eth'), resolverAddress, false]]);
    if (parsed.name === 'supportsInterface') return abi.encodeFunctionResult(parsed.name, [false]);
    assert.equal(parsed.args[0], namehash('example.eth'));
    return abi.encodeFunctionResult(parsed.name, [parsed.name === 'resolver' ? resolverAddress : address]);
  } };
}

test('resolves and normalizes ENS using only the injected provider', async () => {
  const injected = wallet();
  assert.equal(await createEnsResolver(injected)('EXAMPLE.eth'), target);
  assert(injected.calls.some(({ method }) => method === 'eth_call'));
  assert(injected.calls.every(({ method }) => ['eth_call', 'eth_chainId'].includes(method)));
});
test('legacy sendAsync and send providers resolve ENS', async () => {
  for (const method of ['sendAsync', 'send']) {
    const injected = wallet();
    const legacy = { [method](payload, callback) { injected.request(payload).then(result => callback(null, { result }), callback); } };
    assert.equal(await createEnsResolver(legacy)('example.eth'), target);
  }
});
test('unresolved names and invalid names reject for the UI error path', async () => {
  await assert.rejects(createEnsResolver(wallet({ address: ZeroAddress }))('example.eth'), /no address/);
  await assert.rejects(createEnsResolver(wallet())('bad..eth'));
});
test('unsupported networks and wallet failures reject instead of changing networks', async () => {
  await assert.rejects(createEnsResolver(wallet({ chain: '0x539' }))('example.eth'));
  await assert.rejects(createEnsResolver(wallet({ fail: true }))('example.eth'));
});
test('legacy transport and JSON-RPC errors propagate', async () => {
  const err = new Error('transport failed');
  await assert.rejects(adaptProvider({ sendAsync(_p, cb) { cb(err); } }).request({ method: 'eth_chainId' }), /transport failed/);
  await assert.rejects(adaptProvider({ send(_p, cb) { cb(null, { error: { code: -32000, message: 'RPC failed' } }); } }).request({ method: 'eth_chainId' }), /RPC failed/);
});
