import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Form from "react-bootstrap/Form";
import { Dropdown } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import ICategories from "../types/ICategories";
import IGame from "../types/IGames";
import ILeaderboard, { Run, RunElement } from "../types/ILeaderboards";
import IDataset from "./api/times";
import IPlayer from "../types/IPlayer";
import moment, { Moment } from "moment";
import { Line } from "react-chartjs-2";
import { Chart, ChartDataset, ChartOptions, registerables } from "chart.js";
import "chartjs-adapter-moment";
import { ThreeDots } from "react-loader-spinner";

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

	const playerProgressions = new Map<string, IDataset[]>();
	const [playerProgressionsComplete, setPlayerProgressionsComplete] =
		useState<boolean>(false);

	const playerIdToName = new Map<string, string>();

	const [datasets, setDatasets] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);

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
			let date = moment();
			let completeOrders = 0;
			let totalOrders = 20;
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
				date = date.subtract(4, "weeks");
				getLeaderBoard(
					selectedGame.id,
					selectedCategory.id,
					date,
					completeOrder
				);
			}
		}
	}, [selectedCategory]);

	const getGameCategory = async (id: string) => {
		const res = await fetch(
			`https://www.speedrun.com/api/v1/games/${id}/categories`
		);
		const results = await res.json();
		const categories: ICategories[] = results.data;
		setGameCategories(categories);
	};

	const getLeaderBoard = async (
		gameId: string,
		categoryId: string,
		date: Moment,
		completeOrder: () => void
	) => {
		const res = await fetch(
			`https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?date=${date.toISOString()}&top=5`
		);
		const results = await res.json();
		const leaderboards: ILeaderboard = results.data;
		parseLeaderBoard(leaderboards.runs, completeOrder);
	};

	const parseLeaderBoard = (
		runs: RunElement[],
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
			let player = "";

			if (playerIdToName.has(playerId)) {
				//@ts-ignore
				player = playerIdToName.get(playerId);
			} else {
				const res = await fetch(
					`https://www.speedrun.com/api/v1/users/${playerId}`
				);
				const results = await res.json();
				const players: IPlayer = results.data;
				player = players.names.international;
				playerIdToName.set(playerId, player);
			}

			if (playerProgressions.has(player)) {
				if (
					playerProgressions
						.get(player)
						?.filter((dataset) => dataset.id == runElement.run.id)
						.length == 0
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
			resolve();
		};
	};

	const options: ChartOptions<"line"> = {
		scales: {
			x: {
				type: "time",
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
		/**
		 * label: player.name
		 * data: {x, y}[]
		 * []
		 */

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
														setLoading(true);
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
					</div>
				</Form>

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
