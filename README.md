# generic-client-interface

A wrapper for creation a group of clients that are independent from each other, easily testable, and asynchronously imported.

## Installation

```bash
npm i generic-client-interface
```

## Usage

Full api reference: https://electrovir.github.io/generic-client-interface/

-   Define individual clients (one exported per file) with `defineClient`.
-   Define a whole client interface with `defineClientInterface`.

### Defining a client

<!-- example-link: src/readme-examples/define-client.example.ts -->

```TypeScript
import {defineClient} from '..';

/** Clients must be exported. Only one client can be exported per file. */
export const exampleClient1 = defineClient({
    /** Define the client's members. */
    doStuff() {
        console.log('hello');
    },
    async sendRequest(url: string) {
        return await (await fetch(url)).json();
    },
});
```

### Defining a whole client interface

<!-- example-link: src/readme-examples/define-client-interface.example.ts -->

```TypeScript
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
```
