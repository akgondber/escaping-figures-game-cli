import React, {useState, useEffect} from 'react';
import {Text, Box, useInput, Newline} from 'ink';
import TextInput from 'ink-text-input';
import Gradient from 'ink-gradient';
import {nanoid} from 'nanoid';
import figures from 'figures';
import R from 'rambda';

type Props = {
	isShowBanner?: boolean;
	isColorsEnabled?: boolean;
	isUsingFastSpeed?: boolean;
	speed?: number;
};
type AnswerItem = 'CORRECT' | 'WRONG' | 'WAITING';

const rand = (max: number): number => {
	return Math.floor(Math.random() * max);
};

const getRepeatedSpaces = (n: number): string => R.repeat(' ', n).join('');

const breakWithSpaces = (currFigures: string[]): string[] => {
	const result: string[] = [];
	for (const [i, figure] of currFigures.entries()) {
		const leftSpaces = getRepeatedSpaces(rand(7));
		const rightSpaces = getRepeatedSpaces(rand(7));

		if (i === 0 || i === currFigures.length) {
			result.push(
				i === 0 ? leftSpaces : figure,
				i === currFigures.length ? rightSpaces : figure,
			);

			continue;
		}

		result.push(leftSpaces, figure, rightSpaces);
	}

	return result;
};

const spacifyLines = (lines: string[][]) =>
	lines.map((items: string[]) => breakWithSpaces(items));

const isNumeric = (value: string): boolean =>
	!Number.isNaN(value as any) && !Number.isNaN(Number.parseFloat(value));

const calculateSpeedInMs = (speed: number) => ((speed + 30) / 10) * 150;

const isNewSpeedInputCorrect = (value: string) =>
	value === '' || isNumeric(value);

const roundLines = [
	[
		figures.triangleDown,
		figures.star,
		figures.hamburger,
		figures.triangleUp,
		figures.musicNote,
		figures.hamburger,
		figures.triangleDown,
	],
	[
		figures.lozenge,
		figures.triangleUp,
		figures.square,
		figures.lozenge,
		figures.star,
		figures.triangleLeft,
		figures.musicNote,
	],
	[
		figures.hamburger,
		figures.triangleDown,
		figures.lozenge,
		figures.musicNote,
		figures.heart,
		figures.hamburger,
		figures.triangleDown,
	],
	[
		figures.star,
		figures.musicNote,
		figures.hamburger,
		figures.heart,
		figures.triangleDown,
		figures.star,
		figures.triangleLeft,
	],
	[
		figures.triangleRight,
		figures.lozenge,
		figures.triangleLeft,
		figures.star,
		figures.heart,
		figures.hamburger,
		figures.musicNote,
	],
	[
		figures.triangleDown,
		figures.star,
		figures.hamburger,
		figures.musicNote,
		figures.triangleRight,
		figures.square,
		figures.lozenge,
	],
	[
		figures.hamburger,
		figures.triangleRight,
		figures.lozenge,
		figures.star,
		figures.square,
		figures.lozenge,
		figures.triangleUp,
	],
];

const cols: string[] = [
	'red',
	'green',
	'blue',
	'magenta',
	'yellow',
	'whiteBright',
	'cyan',
];
const roundCols = R.map(
	line => R.map(_ => cols[rand(cols.length)], line),
	roundLines,
);

export {rand, calculateSpeedInMs};

export default function App({
	isShowBanner = true,
	isColorsEnabled = false,
	speed = 10,
	isUsingFastSpeed = false,
}: Props) {
	const [displayBanner, setDisplayBanner] = useState(isShowBanner);
	const [gameOver, setGameOver] = useState(false);
	const [scores, setScores] = useState(0);
	const [padLeft, setPadLeft] = useState(0);
	const [currentLines, setCurrentLines] = useState<string[][]>(
		spacifyLines(roundLines),
	);
	const countByFig = R.countBy((item: string) => item, R.flatten(roundLines));
	const allFigures: string[] = R.uniq(R.flatten(roundLines));
	const [correctlyAnswered, setCorrectlyAnswered] = useState<string[]>([]);
	const [figCount, setFigCount] = useState('');
	const [withColors, setWithColors] = useState<boolean>(isColorsEnabled);
	const [lastAnswer, setLastAnswer] = useState<AnswerItem>('WAITING');
	const [gameSpeed, setGameSpeed] = useState(calculateSpeedInMs(speed));
	const [isChangingSpeed, setIsChangingSpeed] = useState(false);
	const [newChangingSpeedValue, setNewChangingSpeedValue] = useState(
		String(speed),
	);

	const resetGame = () => {
		setGameOver(false);
		setPadLeft(0);
		setScores(0);
		setCurrentLines(spacifyLines(roundLines));
		setCorrectlyAnswered([]);
		setFigCount('');
	};

	useInput((key, _input) => {
		if (gameOver) {
			switch (key) {
				case 'n': {
					console.clear();
					resetGame();

					break;
				}

				case 'b': {
					setDisplayBanner(!displayBanner);

					break;
				}

				case 'c': {
					setWithColors(!withColors);

					break;
				}

				case 's': {
					setIsChangingSpeed(true);

					break;
				}
				// No default
			}
		}
	});

	useEffect(() => {
		/* eslint-disable max-nested-callbacks */
		if (!gameOver) {
			const gameInterval = setInterval(
				() => {
					setCurrentLines((_previousCurrentLines: string[][]): string[][] => {
						const newRoundLines = spacifyLines(roundLines);

						setPadLeft(previousPadLeft => {
							const widest: string[] = R.head(
								R.sort((a, b) => (a.length > b.length ? -1 : 1), newRoundLines),
							);
							const newPadLeft = previousPadLeft + 2;

							// eslint-disable-next-line n/prefer-global/process
							if (newPadLeft + widest.length + 35 > process.stdout.columns) {
								setGameOver(true);
							}

							return newPadLeft;
						});

						return newRoundLines;
					});
				},
				isUsingFastSpeed ? 450 : gameSpeed,
			);
			return () => {
				clearInterval(gameInterval);
			};
		}
		/* eslint-enable max-nested-callbacks */
	}, [padLeft, displayBanner, gameOver, isUsingFastSpeed, gameSpeed]);

	return (
		<>
			{displayBanner && (
				<Box flexDirection="column" alignItems="center">
					<Gradient name="summer">
						<Text>ESCAPING FIGURES GAME</Text>
					</Gradient>
				</Box>
			)}
			{gameOver ? (
				isChangingSpeed ? (
					<Box>
						<Text
							color={isNewSpeedInputCorrect(newChangingSpeedValue) ? '' : 'red'}
						>
							New speed:{' '}
						</Text>
						<TextInput
							value={newChangingSpeedValue}
							onChange={setNewChangingSpeedValue}
							onSubmit={value => {
								if (isNumeric(value)) {
									const newSpeed = Number(value);

									setGameSpeed(calculateSpeedInMs(newSpeed));
									setNewChangingSpeedValue(value);
									setIsChangingSpeed(false);
								}
							}}
						/>
					</Box>
				) : (
					<Box flexDirection="column">
						<Box paddingY={1} flexDirection="column" alignItems="center">
							<Text>
								The game is over! Score: {scores} out of {allFigures.length}
							</Text>
						</Box>
						<Box paddingTop={1} flexDirection="column" alignItems="center">
							<Box>
								<Text>Press: </Text>
							</Box>
							<Box flexDirection="column">
								<Box>
									<Text bold color="green">
										n
									</Text>
									<Text> - start a new round</Text>
								</Box>
								<Box>
									<Text bold color="cyan">
										s
									</Text>
									<Text>
										{' '}
										- change game speed (the lower the value, the more difficult
										the passage; current: {newChangingSpeedValue})
									</Text>
								</Box>
								<Box>
									<Text bold color="magenta">
										b
									</Text>
									<Text>
										{' '}
										- toggle `showBanner` setting (current:{' '}
										{displayBanner ? 'enabled' : 'disabled'})
									</Text>
								</Box>
								<Box>
									<Text bold color="yellow">
										c
									</Text>
									<Text>
										{' '}
										- use colors (current: {withColors ? 'enabled' : 'disabled'}
										)
									</Text>
								</Box>
							</Box>
						</Box>
					</Box>
				)
			) : (
				<Box flexDirection="column">
					<Box flexDirection="column" alignItems="center" paddingBottom={1}>
						<Text>Score: {scores}</Text>
					</Box>
					<Box>
						<Newline />
						<Box flexDirection="column" paddingBottom={2}>
							<Box flexDirection="column" paddingLeft={padLeft}>
								{currentLines.map((lines: string[], i: number) => (
									<Box key={nanoid(10)}>
										{lines.map((fig: string, j: number) => {
											return (
												<Box key={nanoid(10)} flexDirection="column">
													<Text
														color={
															withColors
																? roundCols[i]![j % roundCols[0]!.length]
																: 'green'
														}
													>
														{fig}
													</Text>
													<Newline />
												</Box>
											);
										})}
									</Box>
								))}
							</Box>
						</Box>
					</Box>
					<Box flexDirection="column" alignItems="center">
						<Box paddingTop={1}>
							<Box flexDirection="column">
								<Text>
									How many times the following figure occurs?
									{` ${allFigures[correctlyAnswered.length]!}: `}
								</Text>
							</Box>
							<TextInput
								value={figCount}
								onChange={value => {
									setFigCount(value);
									setLastAnswer('WAITING');
								}}
								onSubmit={value => {
									if (
										countByFig[allFigures[correctlyAnswered.length]!] ===
										Number(value)
									) {
										setLastAnswer('CORRECT');
										setScores(previousScores => {
											setCorrectlyAnswered(previousCorrectly => {
												const newCorrectlyAnswered = [
													...previousCorrectly,
													allFigures[correctlyAnswered.length]!,
												];

												if (newCorrectlyAnswered.length === allFigures.length) {
													setGameOver(true);
												}

												return newCorrectlyAnswered;
											});
											setFigCount('');
											setLastAnswer('WAITING');
											return previousScores + 1;
										});
									} else {
										setLastAnswer('WRONG');
									}
								}}
							/>
							{(lastAnswer === 'CORRECT' || lastAnswer === 'WRONG') && (
								<Text color={lastAnswer === 'CORRECT' ? 'green' : 'red'}>
									{lastAnswer === 'CORRECT' ? figures.tick : figures.cross}
								</Text>
							)}
						</Box>
					</Box>
				</Box>
			)}
		</>
	);
}
