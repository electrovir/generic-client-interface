import {MaybePromise, PropertyValueType, mapObjectValues} from '@augment-vir/common';
import {createMockVir} from 'mock-vir';
import {ClientDefinition, ClientType, isClientDefinition} from './define-client';

/** An async function that imports a client's file. */
export type ClientImporterBase = () => Promise<any>;

/** An object mapping client names to the files wherein they are defined. */
export type ClientInterfaceImportsBase = Record<string, ClientImporterBase>;

/**
 * A plain defined client interface. Each client is lazily loaded (meaning, only when requested are
 * they loaded) and is a promise so that the imports can be dynamic.
 */
export type ClientInterfaceDefinition<ClientImports extends ClientInterfaceImportsBase> = {
    [ClientName in keyof ClientImports]: Promise<
        ClientType<
            Extract<
                PropertyValueType<Awaited<ReturnType<ClientImports[ClientName]>>>,
                ClientDefinition<any>
            >
        >
    >;
};

/**
 * Specifically implemented mocks for each client. These are optional, any that are left blank are
 * replaced with proxy mocks.
 */
export type MockClientInterface<ClientImports extends ClientInterfaceImportsBase> = Partial<{
    [ClientName in keyof ClientImports]: MaybePromise<
        ClientType<
            Extract<
                PropertyValueType<Awaited<ReturnType<ClientImports[ClientName]>>>,
                ClientDefinition<any>
            >
        >
    >;
}>;

/**
 * Define a client interface that automatically asynchronous imports files only when they are
 * needed.
 */
export function defineClientInterface<const ClientImports extends ClientInterfaceImportsBase>({
    clientImports,
    isTestEnv,
    mockClients,
}: {
    clientImports: ClientImports;
    /** Set to true to indicate that mock clients should be used. */
    isTestEnv: boolean;
    /** Optional mock clients. Any left out will use a default proxy mock. */
    mockClients?: MockClientInterface<ClientImports> | undefined;
}): ClientInterfaceDefinition<ClientImports> {
    const clientInterfaceDefinition: ClientInterfaceDefinition<ClientImports> =
        {} as ClientInterfaceDefinition<ClientImports>;

    Object.entries(clientImports).forEach(
        ([
            clientName,
            importCallback,
        ]) => {
            Object.defineProperty(clientInterfaceDefinition, clientName, {
                async get(): Promise<ClientInterfaceImportsBase> {
                    if (isTestEnv) {
                        if (mockClients && clientName in mockClients) {
                            const mockClient = mockClients[clientName];

                            if (!mockClient) {
                                throw new Error(`Mock client for '${clientName}' is not defined.`);
                            }

                            return mockClient;
                        } else {
                            return createMockVir();
                        }
                    } else {
                        const importedModule = await importCallback();

                        const clientDefinition =
                            Object.values(importedModule).find(isClientDefinition);

                        if (!clientDefinition) {
                            throw new Error(
                                `Failed to find any client definitions exported for client '${clientName}'`,
                            );
                        }

                        return await clientDefinition.liveClient();
                    }
                },
            });
            return;
        },
    );

    return clientInterfaceDefinition;
}

/** ClientDefinition with all clients awaited. */
export type AwaitedClients<Definition extends ClientInterfaceDefinition<any>> = {
    [ClientName in keyof Definition]: Awaited<Definition[ClientName]>;
};

/** Await all clients at once so they don't need to be individually awaited later. */
export async function awaitAllClients<const Definition extends ClientInterfaceDefinition<any>>(
    clientInterfaceDefinition: Definition,
): Promise<AwaitedClients<Definition>> {
    const awaitedClients = mapObjectValues(
        clientInterfaceDefinition,
        async (key, value) => await value,
    ) as AwaitedClients<Definition>;

    return awaitedClients;
}
