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
		--no-show-banner  Whether to use banner at the top

	Examples
		$ escaping-figures-game-cli
		$ escaping-figures-game-cli --no-show-banner
		$ escaping-figures-game-cli --use-colors
		$ escaping-figures-game-cli --fast-speed
`,
	{
		importMeta: import.meta,
		flags: {
			showBanner: {
				type: 'boolean',
				default: true,
			},
			useColors: {
				type: 'boolean',
				default: false,
			},
			fastSpeed: {
				type: 'boolean',
				default: false,
			},
		},
	},
);

render(
	<App
		isShowBanner={cli.flags.showBanner}
		isColorsEnabled={cli.flags.useColors}
		isUsingFastSpeed={cli.flags.fastSpeed}
	/>,
);
