<template>
  <div>
    <input v-model="ensName" placeholder="Enter ENS name">
    <button @click="resolveENS">Resolve ENS</button>
    <div v-if="address">
      Address: {{ address }}
    </div>
    <div v-if="error">
      Error: {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      ensName: '',
      address: '',
      error: ''
    };
  },
  methods: {
    async resolveENS() {
      try {
        // print message to console
        console.log('Resolving ENS name...');
        const address = await this.$web3.eth.ens.getAddress(this.ensName);
        this.address = address;
        this.error = '';
      } catch (err) {
        console.error(err);
        this.address = '';
        this.error = 'Error resolving ENS name.';
      }
    }
  }
};
</script>
