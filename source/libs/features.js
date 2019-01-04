/**
 * Enable toggling each feature via options.
 * Prevent fn's errors from blocking the remaining tasks.
 * https://github.com/sindresorhus/refined-github/issues/678
 */
import domLoaded from 'dom-loaded';
import onAjaxedPages from 'github-injection';
import OptionsSync from 'webext-options-sync';
import * as pageDetect from './page-detect';
import {safeOnAjaxedPages} from './utils';

const options = new OptionsSync().getAll();

const pageDetectList = Object.values(pageDetect);

const run = async (filename, constraints, fn) => {
	if (constraints.filter(c => !pageDetectList.contains(c) || c() === false)) {
		return;
	}
	const {disabledFeatures = '', logging = false} = await options;
	const log = logging ? console.log : () => {};

	if (disabledFeatures.includes(filename)) {
		log('↩️', 'Skipping', filename);
		return;
	}
	try {
		// Features can return `false` if they declare themselves as not enabled
		if (await fn() !== false) {
			log('✅', filename);
		}
	} catch (error) {
		console.log('❌', filename);
		throw error;
	}
};

const add = async (filename, constraints, fn) => {
	if (constraints.includes(domLoaded)) {
		await domLoaded;
	}

	if (constraints.includes(safeOnAjaxedPages)) {
		safeOnAjaxedPages(() => run(filename, constraints, fn));
	} else if (constraints.includes(onAjaxedPages)) {
		onAjaxedPages(() => run(filename, constraints, fn));
	} else {
		run(filename, constraints, fn);
	}
};

export const injectCustomCSS = async () => {
	const {customCSS = ''} = await options;

	if (customCSS.length > 0) {
		document.head.append(<style>{customCSS}</style>);
	}
};

export default {
	...pageDetect,
	add,
	domLoaded,
	onAjaxedPages,
	safeOnAjaxedPages
};
