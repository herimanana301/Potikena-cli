import React from 'react';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {Box, Text} from 'ink';
import Link from 'ink-link';

export default function Welcome() {
	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<Gradient name="atlas">
				<BigText text="POTIKENA" />
			</Gradient>
			<Text>Welcome to Potikena — your multi-tool media CLI!</Text>
			<Box padding={0} flexDirection="column">
				<Text>By Herimanana Rasolonirina.</Text>
				<Box gap={2}>
					<Link url="https://www.linkedin.com/in/herimanana/">
						<Text color={'cyan'}>Linkedin</Text>
					</Link>
					<Link url="https://github.com/herimanana301">
						<Text color={'cyan'}>Github</Text>
					</Link>
					<Link url="https://bluetech.team">
						<Text color={'cyan'}>My team</Text>
					</Link>
				</Box>
			</Box>
		</Box>
	);
}
