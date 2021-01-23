import { FJUTACMOJ } from './fjutacm/FJUTACMOJ';
import { CodeforcesOJ } from './codeforces/CodeforcesOJ';

export const backends: { [key: string]: any } = {
	'fjutacm': FJUTACMOJ,
	'codeforces': CodeforcesOJ,
};