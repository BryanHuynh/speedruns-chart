import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Form from "react-bootstrap/Form";
import { Dropdown } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import ICategories from "../types/ICategories";
import IGame from "../types/IGames";
import IVariable, { Option } from "../types/IVariable";
import ILeaderboard, { Run, RunElement } from "../types/ILeaderboards";
import IDataset from "./api/times";
import IPlayer from "../types/IPlayer";
import moment, { Moment } from "moment";
import { Line } from "react-chartjs-2";
import { Chart, ChartDataset, ChartOptions, registerables } from "chart.js";
import "chartjs-adapter-moment";
import { ThreeDots } from "react-loader-spinner";
import zoomPlugin from 'chartjs-plugin-zoom';
import Counter from "../components/counter";

const Home: NextPage = (props: any) => {
	// ui refs
	const searchBarRef = useRef<HTMLInputElement>(null);

	// user selected items
	const [selectedGame, setSelectedGame] = useState<IGame>();
	const [selectedCategory, setSelectedCategory] = useState<ICategories>();

	// selected item checked
	const [gameSelected, setGameSelected] = useState<boolean>(false);
	const [categorySelected, setCategorySelected] = useState<boolean>(false);

	// api response possibilities
	const [games, setGames] = useState<IGame[]>([]);
	const [gameCategories, setGameCategories] = useState<ICategories[]>([]);
	const [categoryVariables, setCategoryVariables] = useState<IVariable[]>([]);

	const playerProgressions = new Map<string, IDataset[]>();
	const [playerProgressionsComplete, setPlayerProgressionsComplete] =
		useState<boolean>(false);

	const playerIdToName = new Map<string, string>();

	const [datasets, setDatasets] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const [fetchCounter, setFetchCounter] = useState<number>(0);

	const [topNPlayers, setTopNPlayers] = useState<number>(5);

	const debug = false;

	const increaseFetchCounter = () => {
		setFetchCounter(fetchCounter + 1);
	};

	useEffect(() => {
		Chart.register(...registerables);
	});

	useEffect(() => {
		if (!selectedGame) return;
		if (searchBarRef.current) {
			searchBarRef.current.value = selectedGame.names.international;
		}
		getGameCategory(selectedGame.id);
	}, [selectedGame]);

	useEffect(() => {
		if (selectedGame && selectedCategory) {
			const variableURI = selectedCategory.links.find(
				(o) => o.rel === "variables"
			);
			if (variableURI) {
				getCategoryVariable(variableURI.uri).then((variables) => {
					const _variables: IVariable[] = [];
					variables.forEach((variable: any) => {
						const options: any = [];
						Object.keys(variable.values.values).map((key: any) => {
							options.push({
								id: key,
								label: variable.values.values[key].label,
							});
							return key;
						});
						_variables.push({
							id: variable.id,
							selected: null,
							name: variable.name,
							options: options,
						});
					});
					setCategoryVariables(_variables);
					if (_variables.length == 0) {
						setLoading(true);
					}
				});
			}
		}
	}, [selectedCategory]);

	useEffect(() => {
		if (!selectedGame || !selectedCategory || !categoryVariables) return;
		console.log("ready 1");
		const ready = categoryVariables
			.map((variable) => {
				return variable.selected != null;
			})
			.every((x) => x);
		if (!ready) return;
		setLoading(true);
	}, [categoryVariables]);

	// useEffect(() => {
	// 	setLoading(true);
	// }, [setTopNPlayers])

	useEffect(() => {
		if (!selectedGame || !selectedCategory) return;
		if (!loading) return;
		generateLeaderboard();
	}, [loading]);

	useEffect(() => {
		if (categoryVariables) {
			console.log(categoryVariables);
		}
	}, [categoryVariables]);

	const generateLeaderboard = () => {
		if (!selectedGame || !selectedCategory) return;
		let variableOptionsString = "";
		if (categoryVariables) {
			const variables = categoryVariables.map((variable) => {
				return "var-" + variable.id + "=" + variable.selected?.id;
			});
			variableOptionsString = variables.join("&");
		}
		let date = moment();
		let completeOrders = 0;
		let totalOrders = 50;
		setLoading(true);
		const completeOrder = () => {
			completeOrders++;
			if (totalOrders == completeOrders) {
				setPlayerProgressionsComplete(true);
				setLoading(false);
				playerProgressions.forEach((value, key) => {
					value.sort((a, b) => b.time - a.time);
				});
				setDatasets(getDatasets());
			}
		};
		for (let i = 0; i < totalOrders; i++) {
			getLeaderBoard(
				selectedGame.id,
				selectedCategory.id,
				date,
				variableOptionsString,
				completeOrder
			);
			date = date.subtract(4, "week");
		}
	}

	const getGameCategory = async (id: string) => {
		increaseFetchCounter();
		const res = await fetch(
			`https://www.speedrun.com/api/v1/games/${id}/categories`
		);
		const results = await res.json();
		const categories: ICategories[] = results.data;
		setGameCategories(categories);
	};

	const getCategoryVariable = async (url: string) => {
		increaseFetchCounter();
		const res = await fetch(url);
		const results = await res.json();
		return results.data;
	};

	const getLeaderBoard = async (
		gameId: string,
		categoryId: string,
		date: Moment,
		variableOptionsString: string,
		completeOrder: () => void
	) => {
		increaseFetchCounter();
		let url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?${[
			"date=" + date.toISOString(),
			variableOptionsString,
			'embed=players',
			`top=${topNPlayers}`,
		].join("&")}`
		const res = await fetch(url);
		const results = await res.json();
		const leaderboards: ILeaderboard = results.data;
		if (leaderboards) {
			parseLeaderBoard(leaderboards.runs, leaderboards.players.data, completeOrder);
		}
	};



	const parseLeaderBoard = (
		runs: RunElement[],
		players: IPlayer[],
		completeOrder: () => void
	) => {
		let requests = runs.reduce((promiseChain, item) => {
			return promiseChain.then(
				() =>
					new Promise((resolve) => {
						processRun(item, resolve);
					})
			);
		}, Promise.resolve());

		requests.then(() => {
			completeOrder();
		});

		const processRun = async (
			runElement: RunElement,
			resolve: (value: void | PromiseLike<void>) => void
		) => {
			const playerId = runElement.run.players[0].id;
			let player = null;

			// get all the players for this category
			if (playerIdToName.has(playerId)) {
				player = playerIdToName.get(playerId);
			} else if (players.some(_player => _player.id === playerId)) {
				const playerData = players.find(_player => _player.id === playerId);
				if (playerData) {
					if (playerData?.names) {
						player = playerData.names.international;
					}
					if (playerData?.name) {
						player = playerData.name;
					}

				}
				if (player) {
					playerIdToName.set(playerId, player);
				}
			}

			if (player == null) {
				increaseFetchCounter();
				const res = await fetch(
					`https://www.speedrun.com/api/v1/users/${playerId}`
				);
				const results = await res.json();
				const players: IPlayer = results.data;
				player = players.names.international;
				playerIdToName.set(playerId, player);
			}

			if (player) {
				if (playerProgressions && playerProgressions.has(player)) {
					if (
						playerProgressions
							.get(player)
							?.filter(
								(dataset) => dataset.id == runElement.run.id
							).length == 0
					) {
						playerProgressions.get(player)?.push({
							submissionDate: runElement.run.date,
							time: runElement.run.times.primary_t,
							player: player,
							id: runElement.run.id,
						});
					}
				} else {
					playerProgressions.set(player, [
						{
							submissionDate: runElement.run.date,
							time: runElement.run.times.primary_t,
							player: player,
							id: runElement.run.id,
						},
					]);
				}
			}
			resolve();
		};
	};

	const options: ChartOptions<"line"> = {
		scales: {
			x: {
				type: "time",
				time: {
					unit: "month",
				}
			},
			y: {
				ticks: {
					autoSkip: false,
					callback: function (value, index, ticks) {
						return moment
							.utc(Number(value) * 1000)
							.format("HH:mm:ss");
					},
				},
			},
		},
	};

	const getDatasets = () => {
		let datasets: any[] = [];
		let labels: Date[] = [];
		playerProgressions.forEach((values: IDataset[], key: string) => {
			const randomNum = () =>
				Math.floor(Math.random() * (235 - 52 + 1) + 52);
			const randomRGB = () =>
				`rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;
			datasets.push({
				label: key,
				data: values.map((value: IDataset) => {
					labels.push(value.submissionDate);
					return {
						x: value.submissionDate,
						y: value.time,
					};
				}),
				backgroundColor: randomRGB(),
				borderColor: randomRGB(),
				stepped: true,
			});
		});
		return {
			labels: labels,
			datasets: datasets,
		};
	};

	return (
		<div className={styles.container}>
			<Head>
				<title>Create Next App</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<Form
					className={styles.Container}
					onSubmit={(e) => {
						e.preventDefault();
					}}
				>
					<Form.Group className={styles.SearchBar}>
						<Form.Label>Game Name</Form.Label>
						<Form.Control
							placeholder="Name"
							ref={searchBarRef}
							className={styles.FlexItems}
							onChange={async (props) => {
								setGameSelected(false);
								setCategorySelected(false);
								setSelectedCategory(undefined);
								const input = props.target.value;
								increaseFetchCounter();
								const res = await fetch(
									`https://www.speedrun.com/api/v1/games?name=${input}`
								);
								const results = await res.json();
								const games: IGame[] = results.data;
								setGames(games);
							}}
						/>
					</Form.Group>
					<div className={styles.SearchSuggestions}>
						{games.length > 0 && gameSelected == false && (
							<Dropdown.Menu className={styles.FlexItems} show>
								{games.map((game: IGame, i: number) => {
									return (
										<Dropdown.Item
											eventKey={i}
											key={i}
											onClick={(event: any) => {
												setSelectedGame(game);
												setGameSelected(true);
											}}
										>
											{game.names.international}
										</Dropdown.Item>
									);
								})}
							</Dropdown.Menu>
						)}
					</div>
					<div className={styles.Category}>
						{gameCategories.length > 0 && (
							<Dropdown>
								<Dropdown.Toggle
									variant="success"
									id="dropdown-basic"
								>
									{selectedCategory
										? selectedCategory.name
										: "Select Category"}
								</Dropdown.Toggle>
								<Dropdown.Menu>
									{gameCategories.map(
										(category: ICategories, i: number) => {
											return (
												<Dropdown.Item
													eventKey={i}
													key={i}
													onClick={(event: any) => {
														setSelectedCategory(
															category
														);
														setCategorySelected(
															true
														);
													}}
												>
													{category.name}
												</Dropdown.Item>
											);
										}
									)}
								</Dropdown.Menu>
							</Dropdown>
						)}

						{categoryVariables.map((variable, i) => {
							return (
								<div key={i}>
									<Dropdown>
										<Dropdown.Toggle
											variant="success"
											id="dropdown-basic"
										>
											{variable.selected
												? variable.selected.label
												: variable.name}
										</Dropdown.Toggle>

										<Dropdown.Menu>
											{variable.options.map(
												(value: Option, i: number) => {
													return (
														<Dropdown.Item
															eventKey={i}
															key={i}
															onClick={() => {
																// set the category variable selected to true
																setCategoryVariables(
																	categoryVariables.map((_variable) => {
																		if (_variable.id === variable.id) {
																			return {
																				...variable,
																				selected: value,
																			};
																		}
																		return _variable;
																	})
																);
															}}
														>
															{value.label}
														</Dropdown.Item>
													);
												}
											)}
										</Dropdown.Menu>
									</Dropdown>
								</div>
							);
						})}
					</div>
					<Counter
						count={topNPlayers}
						setCounter={setTopNPlayers}
					/>
				</Form>
				{debug && <h1>fetch Counter {fetchCounter}</h1>}

				{loading && <ThreeDots width="100" />}
				{playerProgressionsComplete &&
					playerProgressions &&
					!loading &&
					datasets && <Line options={options} data={datasets} />}
			</main>
		</div>
	);
};

export const getServerSideProps = async (context: any) => {
	return {
		props: {},
	};
};

export default Home;
