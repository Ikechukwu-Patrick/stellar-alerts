#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, String, Symbol};

const REGISTRATION_KEY: Symbol = symbol_short!("REGISTERED");

#[contract]
pub struct AlertRegistryContract;

#[contractimpl]
impl AlertRegistryContract {
    /// Registers an alert listener preference on-chain for a user address.
    pub fn register_listener(
        env: Env,
        user: Address,
        channel: Symbol,
        target: String,
    ) {
        user.require_auth();

        // Store user preference in instance storage
        env.storage().instance().set(&(user.clone(), channel.clone()), &target);

        // Publish event for off-chain ingestion watchers
        env.events().publish(
            (REGISTRATION_KEY, user, channel),
            target,
        );
    }

    /// Queries the registered alert target for a given user and channel.
    pub fn get_listener(env: Env, user: Address, channel: Symbol) -> Option<String> {
        env.storage().instance().get(&(user, channel))
    }
}
