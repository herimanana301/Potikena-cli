import React from 'react';
import SelectInput from 'ink-select-input';
import {Box, useApp} from 'ink';
import {Text} from 'ink';
import options from '../data/options.js';
import VideoDownloader from './video_downloader/VideoDownloader.js';
import Mp3Downloader from './mp3_downloader/Mp3Downloader.js';
import BackgroundRemover from './background_remover/BackgroundRemover.js';
import ImageConverter from './image_format_converter/ImageConverter.js';
import ImagePdfConverter from './image_to_pdf/ImagePdfConverter.js';
type OptionItem = {
	label: string;
	value: string;
	description?: string;
};
function Displayer({
	setChoice,
	choice,
	exit
}: {
	choice: string | null;
	setChoice: (value: string | null) => void;
	exit: () => void;
}): React.ReactElement | null {
	React.useEffect(() => {
		if (choice === 'exit') exit();
	}, [choice]);
	switch (choice) {
		case 'video':
			return <VideoDownloader setChoice={setChoice} />;
		case 'mp3converter':
			return <Mp3Downloader setChoice={setChoice} />;
		case 'bg_image':
			return <BackgroundRemover setChoice={setChoice} />;
		case 'img_converter':
			return <ImageConverter setChoice={setChoice}/>;
		case 'img_pdf':
			return <ImagePdfConverter setChoice={setChoice}/>;
		case 'pdf_fusion':
			return <Text>You chose to download a PDF.</Text>;
		default:
			return null;
	}
}
export default function Handlers() {
	const {exit} = useApp();
	const [choice, setChoice] = React.useState<OptionItem['value'] | null>(null);
	const [description, setDescription] = React.useState<
		OptionItem['description'] | null
	>(options[0]?.description || null);

	return (
		<Box flexDirection="column" gap={2}>
			{choice === null ? (
				<Box gap={3}>
					<SelectInput
						items={options as OptionItem[]}
						onSelect={(item: OptionItem) => {
							setChoice(item.value);
						}}
						onHighlight={(item: OptionItem) => {
							setDescription(item.description);
						}}
						initialIndex={0}
						isFocused={choice !== null ? false : true}
					/>
					<Box borderStyle="singleDouble" width={50} height={4}>
						<Text>{description}</Text>
					</Box>
				</Box>
			) : (
				<Displayer choice={choice} setChoice={setChoice} exit={exit} />
			)}
		</Box>
	);
}
