import * as os from 'os';
import * as path from 'path';
import React, {useEffect} from 'react';
import SelectInput from 'ink-select-input';
import {Box, Text} from 'ink';
import {TextInput, Spinner, Alert} from '@inkjs/ui';
import mediaOptions from '../../data/mediaoptions.js';
import downloader from '../../engines/video-downloader.js';
import {access, constants, stat} from 'fs/promises';

type MediaOptionItem = {
	label: string;
	value: string;
};

type ProcessConfirmation = {
	completed: boolean;
	isUrlSubmitted: boolean;
	isDownloadPathSubmitted: boolean;
};

type ActiveField = 'url' | 'path' | null;
type ValidationFlag = keyof ProcessConfirmation;

const defaultDownloadDir: string = path.join(os.homedir(), 'Downloads');

function validateUrl(raw: string): string | null {
	const url = raw.trim();
	if (!url) return 'Please provide a URL.';
	try {
		const u = new URL(url);
		if (u.protocol !== 'https:') return 'URL must start https://';
		return null;
	} catch {
		return 'That does not look like a valid URL.';
	}
}

async function validatePath(raw: string): Promise<string | null> {
	const p = (raw || '').trim() || defaultDownloadDir; // allow Enter to accept default
	try {
		const s = await stat(p);
		if (!s.isDirectory()) return 'Destination must be a directory.';
		// Check write permission
		await access(p, constants.W_OK);
		return null;
	} catch {
		return 'Destination does not exist or is not writable.';
	}
}

export default function VideoDownloader({
	setChoice,
	exit,
}: {
	setChoice: (value: string | null) => void;
	exit: () => void;
}): React.ReactElement | null {
	const [mediaChoice, setMediaChoice] = React.useState<
		MediaOptionItem['value'] | null
	>(null);
	const [url, setUrl] = React.useState<string>('');
	const [downloadPath, setDownloadPath] =
		React.useState<string>(defaultDownloadDir);
	const [processConfirmation, setProcessConfirmation] =
		React.useState<ProcessConfirmation>({
			completed: false,
			isUrlSubmitted: false,
			isDownloadPathSubmitted: false,
		});
	const [activeInput, setActiveInput] = React.useState<ActiveField>('url');
	const [errors, setErrors] = React.useState<{url?: string; path?: string}>({});
	const [isRunning, setIsRunning] = React.useState<boolean>(false);
	const [fatalError, setFatalError] = React.useState<string | null>(null);

	// Handle "exit" from the select menu
	useEffect(() => {
		if (mediaChoice === 'exit') {
			setChoice(null);
		}
	}, [mediaChoice, setChoice]);

	// Kick off download once both inputs are valid and a mediaChoice is set
	useEffect(() => {
		const ready =
			processConfirmation.isUrlSubmitted &&
			processConfirmation.isDownloadPathSubmitted &&
			!!mediaChoice &&
			!isRunning;

		if (!ready) return;

		(async () => {
			try {
				setIsRunning(true);
				const finalPath = (downloadPath || '').trim() || defaultDownloadDir;
				await downloader(mediaChoice!, url.trim(), finalPath);
				setIsRunning(false);
				setProcessConfirmation(prev => ({
					...prev,
					completed: true,
				}));
				exit();
			} catch (e: any) {
				setFatalError(e?.message || 'Download failed. Please try again.');
				setIsRunning(false);
				setActiveInput('path');
				setProcessConfirmation(prev => ({
					...prev,
					isDownloadPathSubmitted: false,
				}));
			}
		})();
	}, [processConfirmation, mediaChoice, url, downloadPath, exit, isRunning]);

	function markSubmitted(flag: ValidationFlag, value: boolean) {
		setProcessConfirmation(prev => ({...prev, [flag]: value}));
	}

	return (
		<Box flexDirection="column" gap={2}>
			<SelectInput
				isFocused={mediaChoice === null}
				items={mediaOptions as MediaOptionItem[]}
				onSelect={(item: MediaOptionItem) => setMediaChoice(item.value)}
				initialIndex={0}
			/>

			{mediaChoice && mediaChoice !== 'exit' ? (
				<Box flexDirection="column" gap={1}>
					<TextInput
						placeholder="Enter the video URL here"
						onChange={value => {
							setUrl(value);
							if (errors.url) setErrors(prev => ({...prev, url: undefined}));
						}}
						onSubmit={async () => {
							const err = validateUrl(url);
							if (err) {
								setErrors(prev => ({...prev, url: err}));
								markSubmitted('isUrlSubmitted', false);
								return;
							}
							markSubmitted('isUrlSubmitted', true);
							setActiveInput('path');
						}}
						isDisabled={activeInput !== 'url' || isRunning}
					/>
					{errors.url ? <Text color="red">{errors.url}</Text> : null}

					<TextInput
						placeholder={`Enter the destination (default: ${defaultDownloadDir})`}
						onChange={value => {
							setDownloadPath(value);
							if (errors.path) setErrors(prev => ({...prev, path: undefined}));
						}}
						suggestions={[defaultDownloadDir]}
						onSubmit={async () => {
							const err = await validatePath(downloadPath);
							if (err) {
								setErrors(prev => ({...prev, path: err}));
								markSubmitted('isDownloadPathSubmitted', false);
								return;
							}
							markSubmitted('isDownloadPathSubmitted', true);
							setActiveInput(null);
						}}
						isDisabled={activeInput !== 'path' || isRunning}
					/>
					{errors.path ? <Text color="red">{errors.path}</Text> : null}

					{fatalError ? <Text color="red">{fatalError}</Text> : null}
					{isRunning ? <Spinner label="Starting downloading..." /> : null}
					{processConfirmation.completed ? (
						<Alert variant="success">
							Video downloaded successfully to : {downloadPath}
						</Alert>
					) : null}
				</Box>
			) : null}
		</Box>
	);
}
