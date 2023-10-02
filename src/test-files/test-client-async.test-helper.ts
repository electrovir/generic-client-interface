import {defineClient} from '../define-client';

export const testClientAsync = defineClient(async () => {
    return {
        greetings(): string {
            return 'hi async';
        },
        numericMethod(): number {
            return 5;
        },
    };
});
