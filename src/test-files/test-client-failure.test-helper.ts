import {defineClient} from '../define-client';

export const failureClient = defineClient(() => {
    throw new Error('intentionally fail');
});
