#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  	$ escaping-figures-game-cli

	Options
		--banner, -b      Do not use banner at the top
		--colors, -c      Display figures with different colors
		--speed, -s       Set game speed (the lower the value, the more difficult the passage)
		--fast-speed, -f  Turn on fast speed mode

	Examples
		$ escaping-figures-game-cli
		$ escaping-figures-game-cli --speed 17
		$ escaping-figures-game-cli --speed 4
		$ escaping-figures-game-cli --banner
		$ escaping-figures-game-cli --colors
		$ escaping-figures-game-cli --fast-speed
`,
	{
		importMeta: import.meta,
		flags: {
			banner: {
				type: 'boolean',
				default: false,
				shortFlag: 'b',
			},
			colors: {
				type: 'boolean',
				default: false,
				shortFlag: 'c',
			},
			speed: {
				type: 'number',
				default: 10,
				shortFlag: 's',
			},
			fastSpeed: {
				type: 'boolean',
				default: false,
				shortFlag: 'f',
			},
		},
	},
);

console.clear();

render(
	<App
		isShowBanner={cli.flags.banner}
		isColorsEnabled={cli.flags.colors}
		speed={cli.flags.speed}
		isUsingFastSpeed={cli.flags.fastSpeed}
	/>,
);
