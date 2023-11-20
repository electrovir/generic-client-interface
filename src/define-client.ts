import {MaybePromise, ensureType, isObject, typedHasProperty} from '@augment-vir/common';
import {isRunTimeType} from 'run-time-assertions';

/** Base type for client setup requirements. */
export type ClientSetupBase = Record<string, any>;

/** Wrapper for the defined client. */
export type ClientDefinition<Client extends ClientSetupBase> = {
    /** Method that constructs or retrieves the client. */
    liveClient: () => Promise<Client>;
};

/** Checks whether the input value looks like a client definition. */
export function isClientDefinition(input: unknown): input is ClientDefinition<any> {
    return (
        isObject(input) &&
        typedHasProperty(input, ensureType<keyof ClientDefinition<any>>('liveClient')) &&
        isRunTimeType(input.liveClient, 'function')
    );
}

/** Extract the client's run-time type from a client definition. */
export type ClientType<Definition extends ClientDefinition<any>> =
    Definition extends ClientDefinition<infer OriginalClient>
        ? OriginalClient extends ClientCreator<infer ReturnedClient>
            ? Awaited<ReturnedClient>
            : OriginalClient
        : never;

/** A function that generates the client. */
export type ClientCreator<Client extends ClientSetupBase> = () => MaybePromise<Client>;

/**
 * Define a client for use within defineClientInterface. Clients are always objects with string
 * keys. Values can be anything: methods, variables, etc.
 */
export function defineClient<const Client extends ClientSetupBase>(
    /**
     * Either the client object itself, a promise of that client, or a function that constructs the
     * client (or a promise of the client).
     */
    liveClient: MaybePromise<Client> | ClientCreator<Client>,
): ClientDefinition<Client> {
    return {
        liveClient(): Promise<Client> {
            const resolvedClient: Promise<Client> = (
                typeof liveClient === 'function' ? liveClient() : liveClient
            ) as Promise<Client>;

            return resolvedClient;
        },
    };
}
