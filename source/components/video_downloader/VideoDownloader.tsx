import * as os from 'os';
import * as path from 'path';
import React, {useEffect} from 'react';
import SelectInput from 'ink-select-input';
import {Box, Text,useApp} from 'ink';
import {TextInput, Alert} from '@inkjs/ui';
import Spinner from 'ink-spinner';
import mediaOptions from '../../data/mediaoptions.js';
import {yQuality} from '../../data/mediaquality.js';
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
	isQualitySelected: boolean;
};

type ActiveField = 'url' | 'path' | 'quality' | null;
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
	setChoice
}: {
	setChoice: (value: string | null) => void;
}): React.ReactElement | null {
	const {exit} = useApp();
	const [mediaChoice, setMediaChoice] = React.useState<
		MediaOptionItem['value'] | null
	>(null);
	const [videoQuality, setVideoQuality] = React.useState<number | null>(null);
	const [url, setUrl] = React.useState<string>('');
	const [downloadPath, setDownloadPath] =
		React.useState<string>(defaultDownloadDir);
	const [processConfirmation, setProcessConfirmation] =
		React.useState<ProcessConfirmation>({
			completed: false,
			isUrlSubmitted: false,
			isDownloadPathSubmitted: false,
			isQualitySelected: false,
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

	// Kick off download once all inputs are valid and a mediaChoice is set
	useEffect(() => {
  const ready =
    processConfirmation.isUrlSubmitted &&
    processConfirmation.isDownloadPathSubmitted &&
    (mediaChoice !== 'youtube' || processConfirmation.isQualitySelected) &&
    !!mediaChoice &&
    !isRunning &&
    !processConfirmation.completed; // Add this check

  if (!ready) return;

  let isSubscribed = true; // Add this flag for cleanup

  (async () => {
    try {
      setIsRunning(true);
      const finalPath = (downloadPath || '').trim() || defaultDownloadDir;
      const success = await downloader(mediaChoice!, url.trim(), finalPath, videoQuality);
      
      if (!isSubscribed) return; // Check if component is still mounted

      setIsRunning(false);
      if (success) {
        setProcessConfirmation(prev => ({
          ...prev,
          completed: true,
        }));
        setTimeout(() => {
          exit();
        }, 1000);
      } else {
        setFatalError('Download failed. Please try again.');
      }
    } catch (e: any) {
      if (!isSubscribed) return;
      
      setFatalError(e?.message || 'Download failed. Please try again.');
      setIsRunning(false);
      setTimeout(() => {
        exit();
      }, 3000);
    }
  })();

  return () => {
    isSubscribed = false; // Cleanup function
  };	}, [mediaChoice, url, downloadPath, videoQuality, processConfirmation.isUrlSubmitted, 
    processConfirmation.isDownloadPathSubmitted, processConfirmation.isQualitySelected]);

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
							setActiveInput(mediaChoice === 'youtube' ? 'quality' : 'path');
						}}
						isDisabled={activeInput !== 'url' || isRunning}
					/>
					{errors.url ? <Text color="red">{errors.url}</Text> : null}

					{mediaChoice === 'youtube' && processConfirmation.isUrlSubmitted && (
					<Box flexDirection="column" gap={1}>
						<SelectInput
							isFocused={activeInput === 'quality'}
							items={yQuality}
							onSelect={(item: {value: number}) => {
								setVideoQuality(item.value);
								markSubmitted('isQualitySelected', true);
								setActiveInput('path');
							}}
						/>
						<Alert variant="info">
							Closest quality to the selected one will be choosed if it is isn't available
						</Alert>
					</Box>
					)}

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

					{fatalError ? (
						<Box flexDirection="column" gap={1}>
							<Text color="red">{fatalError}</Text>
							<Text color="red" >CTRL + C to quit</Text>
						</Box>
						
						) : null}
					{isRunning && !processConfirmation.completed && !fatalError ? 	
					(<Text>
						<Text color="blue">
							<Spinner type="dots" />
						</Text>
						{' Starting download...'}
					</Text>) : null}
					{processConfirmation.completed ? (
						<Box flexDirection="column" gap={1}>
							<Alert variant="success">
								Video downloaded successfully to : {downloadPath}
							</Alert>
							<Text> Press Enter To Exit... </Text>
						</Box>
					) : null}
				</Box>
			) : null}
		</Box>
	);
}
