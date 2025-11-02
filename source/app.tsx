import React from 'react';
import Welcome from './components/Welcome.js';
import Handlers from './components/Handlers.js';
import {Box} from 'ink';
export default function App() {
	return (
		<Box flexDirection="column" gap={1}>
			<Welcome />
			<Handlers />
		</Box>
	);
}
