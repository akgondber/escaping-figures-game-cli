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

const randItem = (items: string[]): string => {
	return items[rand(items.length)]!;
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

const flattenUniq = R.compose(R.uniq, R.flatten);

type CountBy = Record<string, number>;

type FigCoords = {
	coords: string;
	fig: string;
};

type GameStoreItem = {
	roundLines: string[][];
	currentLines: string[][];
	score: number;
	correctAnswers: number;
	padLeft: number;
};

type UpdatableGameStoreProps = Partial<GameStoreItem>;

const getCoordsOfItem = (item: string, multiArray: string[][]): number[][] => {
	const indexes: number[][] = [];

	R.times(i => {
		R.times(j => {
			if (multiArray[i]![j] === item) {
				indexes.push([i, j]);
			}
		}, multiArray[i]!.length);
	}, multiArray.length);

	return indexes;
};

const getCoordsIndices = (n: number, source: number[][]): number[][] => {
	const result: number[][] = [];
	if (n > source.length) {
		return result;
	}

	let selectableItems = R.clone(source);

	R.times((_i: number) => {
		const item = selectableItems[rand(selectableItems.length)]!;

		result.push(item);

		selectableItems = R.dropRepeats(selectableItems);
	}, n);

	return result;
};

const getCountByIdentityFlattened = (multiArray: string[][]): CountBy =>
	R.countBy((item: string) => item, R.flatten(multiArray));

const getCoords = (coords: string): number[] => coords.split('x').map(Number);

const generateRandomFigures = (size: number): string[][] => {
	const figSamples = [
		figures.lozenge,
		figures.triangleUp,
		figures.triangleLeft,
		figures.triangleRight,
		figures.triangleDown,
		figures.hamburger,
		figures.star,
		figures.musicNote,
		figures.lineUpBoldLeftBoldRightBold,
	];
	let selectableFigures = R.clone(figSamples);

	let result: string[][] = [];
	const addedElements: string[] = [];
	R.times((i: number) => {
		result[i] ||= [];

		R.times((j: number) => {
			const randomFigure = selectableFigures[rand(selectableFigures.length)]!;
			addedElements.push(randomFigure);
			result[i]![j] = randomFigure;

			R.forEach((fig: string) => {
				if (R.countBy(R.identity, addedElements)[fig]! > 9) {
					selectableFigures = R.dropRepeats(selectableFigures);
				}
			}, figSamples);

			if (R.isEmpty(selectableFigures)) {
				selectableFigures = R.clone(figSamples);
			}
		}, size);
	}, size);
	const usedFigures: string[] = flattenUniq(result);

	const groupedByFreq: FigCoords[] = R.flatten(
		R.times(i => {
			return R.times(
				(j: number) => ({
					coords: `${i}x${j}`,
					fig: result[i]![j],
				}),
				result[i]!.length,
			);
		}, result.length),
	);

	const notUsedFigures = R.difference(figSamples, usedFigures)!;
	const insertedIndexes: number[][] = [];

	if (!R.isEmpty(notUsedFigures)) {
		let x: number;
		let y: number;
		let coords: number[];

		const indexPairs: any[] = R.take(
			4,
			R.sortBy(
				a => -a[1].length,
				R.toPairs(R.groupBy((item: FigCoords) => item.fig, groupedByFreq)),
			),
		);
		const frequentlyOccuring: FigCoords[] = indexPairs[
			rand(indexPairs.length)
		][1] as FigCoords[];
		let randomFigItem: FigCoords =
			frequentlyOccuring[rand(frequentlyOccuring.length)]!;

		R.times((j: number) => {
			coords = getCoords(randomFigItem.coords);
			x = coords[0]!;
			y = coords[1]!;

			while (R.includes(coords, insertedIndexes)) {
				randomFigItem = frequentlyOccuring[rand(frequentlyOccuring.length)]!;
				coords = getCoords(randomFigItem.coords);
				x = coords[0]!;
				y = coords[1]!;
			}

			insertedIndexes.push([x, y]);
			result[x]![y] = notUsedFigures[j % notUsedFigures.length]!;
		}, notUsedFigures.length);
	}

	const countByAppearanceFrequency = R.filter(
		value => value > 8,
		getCountByIdentityFlattened(result),
	);

	if (!R.isEmpty(countByAppearanceFrequency)) {
		R.forEach((howMany: number, figure: string) => {
			R.times(
				(m: number) => {
					let insertedItemsExclusions: string[] = [];
					const indexesToReplace = getCoordsIndices(
						4 + m,
						getCoordsOfItem(figure, result),
					);
					const itemsToFilter = getCountByIdentityFlattened(result);
					let itemsNotTakenManyTimes = R.take(
						4,
						R.sortBy(
							(a: string): number => itemsToFilter[a]!,
							R.keys<Record<string, number>>(itemsToFilter),
						),
					);
					const replacedItems: CountBy = {};

					R.forEach(indexPair => {
						const valueToSet = randItem(itemsNotTakenManyTimes);
						replacedItems[valueToSet] = replacedItems[valueToSet] ?? 0;
						replacedItems[valueToSet]++;
						insertedItemsExclusions = [
							...insertedItemsExclusions,
							...R.keys<Record<string, number>>(
								R.filter(v => v > 3, replacedItems),
							),
						];
						result = R.set(
							R.lensPath(`${indexPair[0]!}.${indexPair[1]!}`),
							valueToSet,
							result,
						);

						if (!R.isEmpty(insertedItemsExclusions)) {
							itemsNotTakenManyTimes = R.difference(
								itemsNotTakenManyTimes,
								insertedItemsExclusions,
							);
						}
					}, indexesToReplace);
				},
				howMany > 8 ? howMany - 5 : 2,
			);
		}, countByAppearanceFrequency);
	}

	return result;
};

const firstRoundLines = generateRandomFigures(7);

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
	firstRoundLines,
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
	const [gameStore, setGameStore] = useState<GameStoreItem>({
		roundLines: firstRoundLines,
		currentLines: spacifyLines(firstRoundLines),
		score: 0,
		correctAnswers: 0,
		padLeft: 0,
	});

	const allFigures: string[] = R.uniq(R.flatten(gameStore.roundLines));
	const [figCount, setFigCount] = useState('');
	const [withColors, setWithColors] = useState<boolean>(isColorsEnabled);
	const [lastAnswer, setLastAnswer] = useState<AnswerItem>('WAITING');
	const [gameSpeed, setGameSpeed] = useState(calculateSpeedInMs(speed));
	const [isChangingSpeed, setIsChangingSpeed] = useState(false);
	const [newChangingSpeedValue, setNewChangingSpeedValue] = useState(
		String(speed),
	);

	const resetGame = () => {
		const newRoundLines = generateRandomFigures(7);
		setGameOver(false);
		setFigCount('');
		setGameStore({
			padLeft: 0,
			roundLines: newRoundLines,
			currentLines: spacifyLines(newRoundLines),
			score: 0,
			correctAnswers: 0,
		});
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
		if (!gameOver) {
			const gameInterval = setInterval(
				() => {
					setGameStore(previousGameStore => {
						const newRoundLines = spacifyLines(gameStore.roundLines);
						const newPadLeft = previousGameStore.padLeft + 2;

						const widest: string[] = R.head(
							R.sort((a, b) => (a.length > b.length ? -1 : 1), newRoundLines),
						);

						const updatableProps: UpdatableGameStoreProps = {
							padLeft: newPadLeft,
							currentLines: newRoundLines,
						};

						// eslint-disable-next-line n/prefer-global/process
						if (newPadLeft + widest.length + 35 > process.stdout.columns) {
							setGameOver(true);
						}

						return R.mergeRight(previousGameStore, updatableProps);
					});
				},
				isUsingFastSpeed ? 450 : gameSpeed,
			);
			return () => {
				clearInterval(gameInterval);
			};
		}
	}, [displayBanner, gameOver, isUsingFastSpeed, gameSpeed, gameStore]);

	const {correctAnswers, currentLines, roundLines, padLeft} = gameStore;
	const currentFigure = allFigures[correctAnswers]!;

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
								The game is over! Score: {gameStore.score} out of{' '}
								{allFigures.length}
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
						<Text>Score: {gameStore.score}</Text>
					</Box>
					<Box>
						<Newline />
						<Box flexDirection="column" paddingBottom={2}>
							<Box flexDirection="column" paddingLeft={padLeft}>
								{currentLines.map((lines: string[], i: number) => (
									<Box key={nanoid(10)}>
										{lines.map((fig: string, j: number) => {
											return (
												<Text key={nanoid(10)}>
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
												</Text>
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
									<Text bold>
										How many times the figure &quot;{currentFigure}&quot;
										occurs?
									</Text>{' '}
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
										getCountByIdentityFlattened(roundLines)[currentFigure] ===
										Number(value)
									) {
										setLastAnswer('CORRECT');
										setGameStore(previousGameStore =>
											R.mergeRight(previousGameStore, {
												score: R.add(1, previousGameStore.score),
												correctAnswers: R.add(
													1,
													previousGameStore.correctAnswers,
												),
												gameOver:
													previousGameStore.correctAnswers ===
													allFigures.length - 1,
											}),
										);

										setFigCount('');
										setLastAnswer('WAITING');
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
