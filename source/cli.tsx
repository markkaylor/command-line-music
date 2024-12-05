#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import App from './app.js';
import meow from 'meow';

// Get args here if you need
const cli = meow(
	`
	Usage
	  $ clm <commands>

	Examples
	  $ clm yarn setup
`,
	{
		importMeta: import.meta,
	},
);

render(<App cli={cli} />);
