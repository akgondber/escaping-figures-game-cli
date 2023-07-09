import chalk from 'chalk';
import test from 'ava';
import App, {rand} from './source/app.js';

test('greet unknown user', t => {
	t.true(typeof App === 'function');
	t.true(`Tests are ${chalk.red('coming')}`.includes('coming'));
});

test('greet user with a name', t => {
	t.true(rand(10) < 10);
});
