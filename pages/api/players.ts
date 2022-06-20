// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { IPlayer } from "../types/IPlayer";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const id = req.query.id;
	const api_res = await fetch(`https://www.speedrun.com/api/v1/users/${id}`);
	const results = await api_res.json();
	const player: IPlayer = results.data;
	res.status(200).json(player);
}
