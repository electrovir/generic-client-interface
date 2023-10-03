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
