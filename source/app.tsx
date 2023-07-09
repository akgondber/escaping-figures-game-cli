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

		if (i === 0) {
			result.push(leftSpaces, figure);
			continue;
		} else if (i === currFigures.length) {
			result.push(figure, rightSpaces);
			continue;
		}

		result.push(leftSpaces, figure, rightSpaces);
	}

	return result;
};

const spacifyLines = (lines: string[][]) =>
	lines.map((items: string[]) => breakWithSpaces(items));

const roundLines = [
	[
		figures.square,
		figures.triangleUp,
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
		figures.square,
		figures.hamburger,
		figures.triangleDown,
	],
	[
		figures.star,
		figures.musicNote,
		figures.hamburger,
		figures.triangleLeft,
		figures.triangleDown,
		figures.star,
		figures.triangleLeft,
	],
	[
		figures.triangleRight,
		figures.lozenge,
		figures.triangleLeft,
		figures.star,
		figures.square,
		figures.hamburger,
		figures.triangleLeft,
	],
	[
		figures.triangleDown,
		figures.star,
		figures.hamburger,
		figures.musicNote,
		figures.triangleDown,
		figures.square,
		figures.lozenge,
	],
];

const cols: string[] = [
	'red',
	'green',
	'blue',
	'grey',
	'black',
	'purple',
	'orange',
];
const roundCols = R.map(
	line => R.map(_ => cols[rand(cols.length)], line),
	roundLines,
);

export {rand};

export default function App({
	isShowBanner = true,
	isColorsEnabled = false,
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

	const resetGame = () => {
		setGameOver(false);
		setPadLeft(0);
		setScores(0);
		setCurrentLines(spacifyLines(roundLines));
		setCorrectlyAnswered([]);
	};

	useInput((key, _input) => {
		if (gameOver) {
			switch (key) {
				case 'n': {
					resetGame();

					break;
				}

				case 'b': {
					setDisplayBanner(!displayBanner);

					break;
				}

				case 'c': {
					setWithColors(true);

					break;
				}
				// No default
			}
		}
	});

	useEffect(() => {
		/* eslint-disable max-nested-callbacks */
		if (!gameOver) {
			const gameInterval = setInterval(() => {
				setCurrentLines((_previousCurrentLines: string[][]): string[][] => {
					const newRoundLines = spacifyLines(roundLines);

					setPadLeft(previousPadLeft => {
						const widest: string[] = R.head(
							R.sort((a, b) => (a.length > b.length ? 1 : -1), newRoundLines),
						);
						const newPadLeft = previousPadLeft + 2;

						// eslint-disable-next-line n/prefer-global/process
						if (newPadLeft + widest.length + 10 > process.stdout.columns) {
							setGameOver(true);
						}

						return newPadLeft;
					});

					return newRoundLines;
				});
			}, 1200);
			return () => {
				clearInterval(gameInterval);
			};
		}
		/* eslint-enable max-nested-callbacks */
	}, [padLeft, displayBanner, gameOver]);

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
				<Box>
					<Text>
						The round is finished! Score {scores} out of {allFigures.length}
					</Text>
				</Box>
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
													<Text color={withColors ? roundCols[i]![j] : ''}>
														{fig}
													</Text>
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
									How many times the {allFigures[correctlyAnswered.length]}{' '}
									{' occurs? '}
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
