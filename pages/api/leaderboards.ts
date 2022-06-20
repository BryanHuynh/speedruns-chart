// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const game = req.query.game;
	const category = req.query.category;
	const date = req.query.date;
	const api_res = await fetch(
		`https://www.speedrun.com/api/v1/leaderboards/${game}/category/${category}?date=${date}&top=5`
	);
	const results = await api_res.json();
	const leaderBoardData = results.data;
	res.status(200).json(leaderBoardData);
}
