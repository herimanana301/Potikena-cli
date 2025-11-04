import * as os from 'os';
import * as path from 'path';
import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { TextInput, Alert } from '@inkjs/ui';
import Spinner from 'ink-spinner';
import { mergePDFs } from '../../engines/pdf-processing_engine.js';
import { access, constants, stat } from 'fs/promises';

type ProcessConfirmation = {
  completed: boolean;
  isFilesSubmitted: boolean;
  isDownloadPathSubmitted: boolean;
};

type ActiveField = 'files' | 'path' | null;
type ValidationFlag = keyof ProcessConfirmation;

const defaultDownloadDir: string = path.join(os.homedir(), 'Downloads');

async function validatePDFFiles(raw: string): Promise<string | null> {
  const paths = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (!paths.length) return 'Please provide at least one PDF file path.';

  for (const p of paths) {
    try {
      const s = await stat(p);
      if (!s.isFile()) return `Path is not a file: ${p}`;
      if (path.extname(p).toLowerCase() !== '.pdf') return `File is not a PDF: ${p}`;
      await access(p, constants.R_OK);
    } catch {
      return `File does not exist or is not readable: ${p}`;
    }
  }

  return null;
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

export default function PDFMerger({ setChoice }: { setChoice: (value: string | null) => void }): React.ReactElement | null {
  const { exit } = useApp();
  const [filePaths, setFilePaths] = React.useState<string>('');
  const [downloadPath, setDownloadPath] = React.useState<string>(defaultDownloadDir);
  const [processConfirmation, setProcessConfirmation] = React.useState<ProcessConfirmation>({
    completed: false,
    isFilesSubmitted: false,
    isDownloadPathSubmitted: false,
  });
  const [activeInput, setActiveInput] = React.useState<ActiveField>('files');
  const [errors, setErrors] = React.useState<{ files?: string; path?: string }>({});
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [fatalError, setFatalError] = React.useState<string | null>(null);

  useEffect(() => {
    const ready =
      processConfirmation.isFilesSubmitted &&
      processConfirmation.isDownloadPathSubmitted &&
      !isRunning &&
      !processConfirmation.completed;

    if (!ready) return;

    let isSubscribed = true;

    (async () => {
      try {
        setIsRunning(true);
        const finalPath = (downloadPath || '').trim() || defaultDownloadDir;
        const filesArray = filePaths.split(',').map(p => p.trim()).filter(Boolean);
        const success = await mergePDFs(filesArray, finalPath);

        if (!isSubscribed) return;

        setIsRunning(false);
        if (success) {
          setProcessConfirmation(prev => ({ ...prev, completed: true }));
          setTimeout(() => exit(), 1000);
        } else {
          setFatalError('PDF merge failed. Please try again.');
        }
      } catch (e: any) {
        if (!isSubscribed) return;

        setFatalError(e?.message || 'PDF merge failed. Please try again.');
        setIsRunning(false);
        setTimeout(() => exit(), 3000);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [
    filePaths,
    downloadPath,
    processConfirmation.isFilesSubmitted,
    processConfirmation.isDownloadPathSubmitted,
  ]);

  function markSubmitted(flag: ValidationFlag, value: boolean) {
    setProcessConfirmation(prev => ({ ...prev, [flag]: value }));
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box width={60}>
        <Alert variant="info">Provide PDF files to merge, separated by commas</Alert>
      </Box>

      <TextInput
        placeholder="Enter PDF file paths (comma separated) or 'exit' to go back"
        onChange={value => {
          setFilePaths(value);
          if (errors.files) setErrors(prev => ({ ...prev, files: undefined }));
        }}
        onSubmit={async () => {
          if (filePaths === 'exit') return setChoice(null);
          const err = await validatePDFFiles(filePaths);
          if (err) {
            setErrors(prev => ({ ...prev, files: err }));
            markSubmitted('isFilesSubmitted', false);
            return;
          }
          markSubmitted('isFilesSubmitted', true);
          setActiveInput('path');
        }}
        isDisabled={activeInput !== 'files' || isRunning}
      />
      {errors.files ? <Text color="red">{errors.files}</Text> : null}

      <TextInput
        placeholder={`Enter destination directory (default: ${defaultDownloadDir})`}
        onChange={value => {
          setDownloadPath(value);
          if (errors.path) setErrors(prev => ({ ...prev, path: undefined }));
        }}
        onSubmit={async () => {
          const err = await validatePath(downloadPath);
          if (err) {
            setErrors(prev => ({ ...prev, path: err }));
            markSubmitted('isDownloadPathSubmitted', false);
            return;
          }
          markSubmitted('isDownloadPathSubmitted', true);
          setActiveInput(null);
        }}
        suggestions={[defaultDownloadDir]}
        isDisabled={activeInput !== 'path' || isRunning}
      />
      {errors.path ? <Text color="red">{errors.path}</Text> : null}

      {fatalError && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">{fatalError}</Text>
          <Text color="red">CTRL + C to quit</Text>
        </Box>
      )}

      {isRunning && !processConfirmation.completed && !fatalError && (
        <Text>
          <Text color="blue">
            <Spinner type="dots" />
          </Text>{' '}
          Merging PDFs...
        </Text>
      )}

      {processConfirmation.completed && (
        <Box flexDirection="column" gap={1}>
          <Alert variant="success">
            PDFs merged successfully! Find it here: {downloadPath}
          </Alert>
          <Text>Press Enter to exit...</Text>
        </Box>
      )}
    </Box>
  );
}
