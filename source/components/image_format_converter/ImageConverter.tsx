import * as os from 'os';
import * as path from 'path';
import React, {useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import {TextInput, Alert} from '@inkjs/ui';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import {access, constants, stat} from 'fs/promises';
import convertImage from '../../engines/image-format-converter.js';
import supportedFormat from '../../data/mediasupportedformat.js';

type ProcessConfirmation = {
	completed: boolean;
	isUrlSubmitted: boolean;
	isDownloadPathSubmitted: boolean;
	isFormatSubmitted: boolean;
};

type ActiveField = 'url' | 'path' | 'format' | null;
type targetFormat = "png" | "jpg" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | null
type ValidationFlag = keyof ProcessConfirmation;

const defaultDownloadDir: string = path.join(os.homedir(), 'Downloads');


async function validateFilePath(raw: string): Promise<string | null> {
	const p = (raw || '').trim();
	if (!p) return 'Please provide a file path.';

	try {
		const s = await stat(p);
		if (!s.isFile()) return 'Path must point to a file, not a directory.';

		const ext = path.extname(p).toLowerCase().replace('.', '');
		if (!supportedFormat.includes(ext)) {
			return `Unsupported file type. Supported: ${supportedFormat.join(', ')}`;
		}

		await access(p, constants.R_OK);
		return null;
	} catch {
		return 'File does not exist or is not readable.';
	}
}

async function validatePath(raw: string): Promise<string | null> {
	const p = (raw || '').trim() || defaultDownloadDir;
	try {
		const s = await stat(p);
		if (!s.isDirectory()) return 'Destination must be a directory.';
		await access(p, constants.W_OK);
		return null;
	} catch {
		return 'Destination does not exist or is not writable.';
	}
}

export default function ImageConverter({setChoice
}: {
    setChoice: (value: string | null) => void;
}): React.ReactElement | null {
	const {exit} = useApp();
	const [url, setUrl] = React.useState<string>('');
	const [downloadPath, setDownloadPath] =
		React.useState<string>(defaultDownloadDir);
	const [targetFormat, setTargetFormat] = React.useState<targetFormat>(null);
	const [processConfirmation, setProcessConfirmation] =
		React.useState<ProcessConfirmation>({
			completed: false,
			isUrlSubmitted: false,
			isDownloadPathSubmitted: false,
			isFormatSubmitted: false,
		});
	const [activeInput, setActiveInput] = React.useState<ActiveField>('url');
	const [errors, setErrors] = React.useState<{url?: string; path?: string}>({});
	const [isRunning, setIsRunning] = React.useState<boolean>(false);
	const [fatalError, setFatalError] = React.useState<string | null>(null);

	useEffect(() => {
		const ready =
			processConfirmation.isUrlSubmitted &&
			processConfirmation.isDownloadPathSubmitted &&
			processConfirmation.isFormatSubmitted &&
			!isRunning &&
			!processConfirmation.completed;
		if (!ready) return;

		let isSubscribed = true;

		(async () => {
			try {
				setIsRunning(true);
				const finalPath = (downloadPath || '').trim() || defaultDownloadDir;
				const success = await convertImage(
					url.trim().replace(/\\/g, '/'),
					finalPath.replace(/\\/g, '/'),
					targetFormat
				);

				if (!isSubscribed) return;

				setIsRunning(false);
				if (success) {
					setProcessConfirmation(prev => ({
						...prev,
						completed: true,
					}));
					setTimeout(() => exit(), 1000);
				} else {
					setFatalError('Image conversion failed. Please try again.');
				}
			} catch (e: any) {
				if (!isSubscribed) return;

				setFatalError(e?.message || 'Image conversion failed. Please try again.');
				setIsRunning(false);
				setTimeout(() => exit(), 3000);
			}
		})();

		return () => {
			isSubscribed = false;
		};
	}, [
		url,
		downloadPath,
		targetFormat,
		processConfirmation.isUrlSubmitted,
		processConfirmation.isDownloadPathSubmitted,
		processConfirmation.isFormatSubmitted,
	]);

	function markSubmitted(flag: ValidationFlag, value: boolean) {
		setProcessConfirmation(prev => ({...prev, [flag]: value}));
	}

	return (
		<Box flexDirection="column" gap={1}>
			<Box width={65}>
				<Alert variant="info">
					Supports PNG, JPEG(JPG), WEBP, AVIF, TIFF, GIF conversion
				</Alert>
			</Box>

			<TextInput
				placeholder="Enter the image file path here (type 'exit' to go back)"
				onChange={value => {
					setUrl(value);
					if (errors.url) setErrors(prev => ({...prev, url: undefined}));
				}}
				onSubmit={async () => {
					if (url === 'exit') return setChoice(null);
					const err = await validateFilePath(url);
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
				placeholder={`Enter destination directory (default: ${defaultDownloadDir})`}
				onChange={value => {
					setDownloadPath(value);
					if (errors.path) setErrors(prev => ({...prev, path: undefined}));
				}}
				onSubmit={async () => {
					const err = await validatePath(downloadPath);
					if (err) {
						setErrors(prev => ({...prev, path: err}));
						markSubmitted('isDownloadPathSubmitted', false);
						return;
					}
					markSubmitted('isDownloadPathSubmitted', true);
					setActiveInput('format');
				}}
				suggestions={[defaultDownloadDir]}
				isDisabled={activeInput !== 'path' || isRunning}
			/>
			{errors.path ? <Text color="red">{errors.path}</Text> : null}

			{activeInput === 'format' && (
				<Box flexDirection="column" gap={1}>
					<Text>Select target format:</Text>
					<SelectInput
                        //@ts-ignore
						items={supportedFormat.filter((format)=>format!=path.extname(url).toLowerCase().replace('.', '')).map(fmt => ({label: fmt.toUpperCase(), value: fmt}))}
						onSelect={(item:{ label: string; value: targetFormat }) => {
							setTargetFormat(item.value);
							markSubmitted('isFormatSubmitted', true);
							setActiveInput(null);
						}}
                        initialIndex={0}
					/>
				</Box>
			)}

			{fatalError ? (
				<Box flexDirection="column" gap={1}>
					<Text color="red">{fatalError}</Text>
					<Text color="red">CTRL + C to quit</Text>
				</Box>
			) : null}

			{isRunning && !processConfirmation.completed && !fatalError ? (
				<Text>
					<Text color="blue">
						<Spinner type="dots" />
					</Text>
					{' Converting image...'}
				</Text>
			) : null}

			{processConfirmation.completed ? (
				<Box flexDirection="column" gap={1}>
					<Alert variant="success">
						Image converted successfully! Find it here: {downloadPath}
					</Alert>
					<Text>Press Enter to exit...</Text>
				</Box>
			) : null}
		</Box>
	);
}
