import {assertThrows, assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {assertInstanceOf} from 'run-time-assertions';
import {awaitAllClients, defineClientInterface} from './define-client-interface';

const exampleClientInterface = defineClientInterface({
    clientImports: {
        basic: () => import('./test-files/test-client-basic.test-helper'),
        async: () => import('./test-files/test-client-async.test-helper'),
    },
    isTestEnv: false,
});

describe(defineClientInterface.name, () => {
    it('results in proper output types', async () => {
        assertTypeOf(exampleClientInterface.basic).toMatchTypeOf<
            Promise<{greetings: () => string}>
        >();
        assertTypeOf(exampleClientInterface.async).toMatchTypeOf<
            Promise<{
                greetings: () => string;
                numericMethod: () => number;
            }>
        >();

        assertInstanceOf(exampleClientInterface.basic, Promise);
        assertInstanceOf(exampleClientInterface.async, Promise);
    });

    it('returns the async clients', async () => {
        const basicClient = await exampleClientInterface.basic;
        assert.strictEqual(basicClient.greetings(), 'hi basic');

        const asyncClient = await exampleClientInterface.async;
        assert.strictEqual(asyncClient.greetings(), 'hi async');
        assert.strictEqual(asyncClient.numericMethod(), 5);
    });

    it('does not return mocks in non-test env', async () => {
        const asyncClient = await exampleClientInterface.async;
        assertThrows(() => {
            /**
             * This error is legit, but we want to ignore the type errors here so we can force a
             * run-time error.
             */
            // @ts-expect-error
            assert.isDefined(asyncClient.anything.that.does.not.actually.exist);
        });
    });

    it('throws an error in test env if the mock client is undefined', async () => {
        const testEnvClientInterface = defineClientInterface({
            clientImports: {
                basic: () => import('./test-files/test-client-basic.test-helper'),
                async: () => import('./test-files/test-client-async.test-helper'),
            },
            isTestEnv: true,
            /**
             * Intentionally set this to undefined, which shouldn't be possible based on the types,
             * to test what happens when it is undefined.
             */
            // @ts-expect-error
            mockClients: {
                basic: undefined,
            },
        });

        await assertThrows(async () => await testEnvClientInterface.basic);
    });

    it('errors if the imported client file exports no client definition', async () => {
        const missingClientInterface = defineClientInterface({
            clientImports: {
                basic: () => import('./test-files/test-client-no-client.test-helper'),
            },
            isTestEnv: false,
        });

        await assertThrows(async () => await missingClientInterface.basic);
    });

    it('returns mock clients if in testing env', async () => {
        const testEnvClientInterface = defineClientInterface({
            clientImports: {
                basic: () => import('./test-files/test-client-basic.test-helper'),
                async: () => import('./test-files/test-client-async.test-helper'),
            },
            isTestEnv: true,
            mockClients: {
                basic: {
                    greetings() {
                        return 'mock hi basic';
                    },
                },
            },
        });

        const mockAsyncClient = await testEnvClientInterface.async;
        /** Access something that clearly doesn't exist to demonstrate that we're using a proxy mock. */
        // @ts-expect-error
        assert.isDefined(mockAsyncClient.anything.that.does.not.actually.exist);

        const mockBasicClient = await testEnvClientInterface.basic;
        assert.strictEqual(mockBasicClient.greetings(), 'mock hi basic');
    });

    it('returns mock clients from a function', async () => {
        const testEnvClientInterface = defineClientInterface({
            clientImports: {
                basic: () => import('./test-files/test-client-basic.test-helper'),
                async: () => import('./test-files/test-client-async.test-helper'),
            },
            isTestEnv: true,
            mockClients() {
                return {
                    basic: {
                        greetings() {
                            return 'mock hi basic';
                        },
                    },
                };
            },
        });

        const mockAsyncClient = await testEnvClientInterface.async;
        /** Access something that clearly doesn't exist to demonstrate that we're using a proxy mock. */
        // @ts-expect-error
        assert.isDefined(mockAsyncClient.anything.that.does.not.actually.exist);

        const mockBasicClient = await testEnvClientInterface.basic;
        assert.strictEqual(mockBasicClient.greetings(), 'mock hi basic');
    });
});

describe(awaitAllClients.name, () => {
    it('awaits all clients', async () => {
        const awaitedClientInterface = await awaitAllClients(exampleClientInterface);

        assert.notInstanceOf(awaitedClientInterface.basic, Promise);
        assert.notInstanceOf(awaitedClientInterface.async, Promise);

        assert.strictEqual(awaitedClientInterface.basic.greetings(), 'hi basic');

        assert.strictEqual(awaitedClientInterface.async.greetings(), 'hi async');
        assert.strictEqual(awaitedClientInterface.async.numericMethod(), 5);
    });

    it('does not fail the entire awaiting if one client fails', async () => {
        const interfaceWithError = defineClientInterface({
            clientImports: {
                basic: () => import('./test-files/test-client-basic.test-helper'),
                async: () => import('./test-files/test-client-async.test-helper'),
                failure: () => import('./test-files/test-client-failure.test-helper'),
            },
            isTestEnv: false,
        });

        const awaitedClientInterface = await awaitAllClients(interfaceWithError);

        assert.notInstanceOf(awaitedClientInterface.basic, Promise);
        assert.notInstanceOf(awaitedClientInterface.async, Promise);
        assert.isUndefined(awaitedClientInterface.failure);

        assert.strictEqual(awaitedClientInterface.basic.greetings(), 'hi basic');

        assert.strictEqual(awaitedClientInterface.async.greetings(), 'hi async');
        assert.strictEqual(awaitedClientInterface.async.numericMethod(), 5);
    });
});
