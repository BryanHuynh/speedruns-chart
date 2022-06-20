// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import IGame from "../../types/IGames";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<IGame>
) {
	const input = req.query.name;
	const api_res = await fetch(
		`https://www.speedrun.com/api/v1/games?name=${input}`
	);
	const results: IGame = await api_res.json();

	res.status(200).json(results);
}
