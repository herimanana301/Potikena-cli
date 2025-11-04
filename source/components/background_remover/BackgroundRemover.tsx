import * as os from 'os';
import * as path from 'path';
import React, {useEffect} from 'react';
import {Box, Text,useApp} from 'ink';
import {TextInput, Alert} from '@inkjs/ui';
import Spinner from 'ink-spinner';
import  remove  from '../../engines/background-remover.js';
import {access, constants, stat} from 'fs/promises';
type ProcessConfirmation = {
	completed: boolean;
	isUrlSubmitted: boolean;
	isDownloadPathSubmitted: boolean;
};

type ActiveField = 'url' | 'path' | 'quality' | null;
type ValidationFlag = keyof ProcessConfirmation;

const defaultDownloadDir: string = path.join(os.homedir(), 'Downloads');

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

async function validateFilePath(raw: string): Promise<string | null> {
  const p = (raw || '').trim();
  if (!p) return 'Please provide a file path.';

  try {
    const s = await stat(p);
    if (!s.isFile()) return 'Path must point to a file, not a directory.';

    const ext = path.extname(p).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`;
    }

    await access(p, constants.R_OK);
    return null; // valid
  } catch {
    return 'File does not exist or is not readable.';
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

export default function BackgroundRemover({
	setChoice
}: {
	setChoice: (value: string | null) => void;
}): React.ReactElement | null {
	const {exit} = useApp();
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
	// Kick off download once all inputs are valid and a mediaChoice is set
	useEffect(() => {
  const ready =
    processConfirmation.isUrlSubmitted &&
    processConfirmation.isDownloadPathSubmitted &&
    !isRunning &&
    !processConfirmation.completed;
  if (!ready) return;

  let isSubscribed = true;

  (async () => {
    try {
      setIsRunning(true);
      const finalPath = (downloadPath || '').trim() || defaultDownloadDir;
      const success = await remove(url.trim().replace(/\\/g, "/"), finalPath.replace(/\\/g, "/"));
      
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
        setFatalError('Background remove failed. Please try again.');
      }
    } catch (e: any) {
      if (!isSubscribed) return;
      
      setFatalError(e?.message || 'Background remove failed. Please try again.');
      setIsRunning(false);
      setTimeout(() => {
        exit();
      }, 3000);
    }
  })();

  return () => {
    isSubscribed = false;
  };	}, [url, downloadPath, processConfirmation.isUrlSubmitted, 
    processConfirmation.isDownloadPathSubmitted]);

	function markSubmitted(flag: ValidationFlag, value: boolean) {
		setProcessConfirmation(prev => ({...prev, [flag]: value}));
	}

	return (
            <Box flexDirection="column" gap={1}>
                <Box width={40} >
                    <Alert variant="info" >
                         Supports PNG, Jpeg(jpg), Webp
                    </Alert>
                </Box>

                <TextInput
                    placeholder="Enter the image file path here (type 'exit' to go back)"
                    onChange={value => {
                        setUrl(value);
                        if (errors.url) setErrors(prev => ({...prev, url: undefined}));
                    }}
                    onSubmit={async () => {
                        const err = await validateFilePath(url);
                        if (url==="exit"){
                            setChoice(null);
                        }
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
                    placeholder={`Enter the directory destination (default: ${defaultDownloadDir})`}
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
                    {' Starting processing...'}
                </Text>) : null}
                {processConfirmation.completed ? (
                    <Box flexDirection="column" gap={1}>
                        <Alert variant="success">
                            Background removed successfully ! Find it here : {downloadPath}
                        </Alert>
                        <Text> Press Enter To Exit... </Text>
                    </Box>
                ) : null}
            </Box>
	);
}
