import React from 'react';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {Box, Text} from 'ink';

export default function Welcome() {
	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<Gradient name="atlas">
				<BigText text="POTIKENA" />
			</Gradient>
			<Text>Welcome to Potikena — your multi-tool media CLI!</Text>
			<Box padding={0} flexDirection="column">
				<Text>By Herimanana Rasolonirina.</Text>
			</Box>
		</Box>
	);
}
