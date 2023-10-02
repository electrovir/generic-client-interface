import {defineClient} from '../define-client';

export const testClientBasic = defineClient({
    greetings(): string {
        return 'hi basic';
    },
});
