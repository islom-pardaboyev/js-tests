import type { BankItem } from '../types';
import { easySeed } from './easy';
import { easyMore } from './easyMore';
import { hardSeed } from './hard';
import { mediumSeed } from './medium';
import { mediumMore } from './mediumMore';

/** Bundled starter bank. Upload it to Firestore from the admin panel, or replace it with your own. */
export const seedBank: BankItem[] = [...easySeed, ...easyMore, ...mediumSeed, ...mediumMore, ...hardSeed];
