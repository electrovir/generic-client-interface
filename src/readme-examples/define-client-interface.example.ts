import {awaitAllClients, defineClientInterface} from '..';

const myClientInterface = defineClientInterface({
    /** Establish the client names and where they're imported from. */
    clientImports: {
        exampleClient: () => import('./define-client.example'),
    },
    /** When set to true, mock clients will be used. */
    isTestEnv: false,
    /** Optionally provide mock implementations. */
    mockClients: {
        exampleClient: {
            doStuff() {
                return '';
            },
            sendRequest() {
                return Promise.resolve({});
            },
        },
    },
});

/** Async wrapper function for async example purposes. */
async function main() {
    /** A client must be awaited before it can be accessed. */
    (await myClientInterface.exampleClient).doStuff();

    /** All clients can be awaited in a single promise. */
    const clients = awaitAllClients(myClientInterface);
    (await clients).exampleClient.doStuff();
}
