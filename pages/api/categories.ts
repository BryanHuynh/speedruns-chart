// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import ICategories from "../../types/ICategories";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const input = req.query.id;
	const api_res = await fetch(
		`https://www.speedrun.com/api/v1/games/${input}/categories`
	);
	const results: ICategories[] = await api_res.json();
	res.status(200).json(results);
}
