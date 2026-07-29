import { assertProviderContract } from "./provider-contract.js";

export class ProviderRegistry {
  #providers = new Map();

  register(name, provider) {
    this.#providers.set(name, assertProviderContract(provider));
    return this;
  }

  get(name) {
    return this.#providers.get(name) ?? null;
  }
}
