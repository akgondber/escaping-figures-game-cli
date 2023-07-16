import chalk from 'chalk';
import test from 'ava';
import App, {rand} from './source/app.js';

test('App is a function', t => {
	t.true(typeof App === 'function');
	t.true(`Tests are ${chalk.red('coming')}`.includes('coming'));
});

test('rand() returns random value with high bound', t => {
	t.true(rand(10) < 10);
});
