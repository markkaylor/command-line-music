#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import App from './app.js';

// Get args here if you need
// const cli = meow(
// 	`
// 	Usage
// 	  $ clm <commands>

// 	Examples
// 	  $ clm yarn setup
// `,
// 	{
// 		importMeta: import.meta,
// 		flags: {
// 			name: {
// 				type: 'string',
// 			},
// 		},
// 	},
// );

render(<App />);
