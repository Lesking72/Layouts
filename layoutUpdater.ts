require('dotenv').config()
import 'source-map-support/register'
const editJsonFile = require('edit-json-file')
import { uuid } from 'uuidv4'
const pgPromise = require('pg-promise')
import { accessSync, constants, readdirSync, statSync, readFileSync } from 'fs'

const config = {
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
}

export const pgp = pgPromise({ capSQL: true })
export const db = pgp(config)

const exist = (dir) => {
	try {
		accessSync(dir, constants.F_OK | constants.R_OK | constants.W_OK)
		return true
	} catch (e) {
		return false
	}
}

async function run() {
	const dbLayouts = await db.any(`
		SELECT *
		FROM layouts
	`)

	const targetFolders = readdirSync('./').filter(
		(lF) =>
			!lF.startsWith('@') && !lF.startsWith('.') && !lF.startsWith('node_modules') && statSync(lF).isDirectory()
	)

	const layoutFolders = []
	targetFolders.forEach((m) => {
		readdirSync(m).forEach((lF) => {
			layoutFolders.push(`${m}/${lF}`)
		})
	})

	const layouts = layoutFolders.map((lF) => {
		const fD = editJsonFile(`${lF}/details.json`)

		if (!fD.get('uuid')) {
			const U = uuid()
			fD.set('uuid', U)
			fD.save()
		}

		const details = fD.toObject(),
			baselayout = readFileSync(`${lF}/layout.json`, 'utf-8')
		let commonlayout = null
		try {
			commonlayout = readFileSync(`${lF}/common.json`, 'utf-8')
		} catch (e) {}

		const pcs = []
		if (exist(`${lF}/pieces`)) {
			const opts = readdirSync(`${lF}/pieces`)
			opts.forEach((op) => {
				const split = op.split('_')
				if (split.length > 1) split.shift()
				const optionName = split.join()

				const values = readdirSync(`${lF}/pieces/${op}`)
				const jsons = values.filter((v) => v.endsWith('.json'))

				const valueJsons = []
				jsons.forEach((j) => {
					const trimmed = j.replace('.json', '')

					const fO = editJsonFile(`${lF}/pieces/${op}/${trimmed}.json`)
					if (!fO.get('uuid')) {
						fO.set('uuid', uuid())
						fO.save()
					}

					const value = fO.toObject()
					const value_uuid = value.uuid
					delete value.uuid

					valueJsons.push({
						value: jsons.length > 1 ? trimmed : true,
						uuid: value_uuid,
						image: values.includes(`${trimmed}.png`) ? `${trimmed}.png` : null,
						json: JSON.stringify(value),
					})
				})

				pcs.push({
					name: optionName,
					values: valueJsons,
				})
			})
		}

		let resJson: any = {
			uuid: details.uuid,
			details,
			baselayout,
			target: JSON.parse(baselayout).TargetName.replace(/.szs/i, ''),
			last_updated: new Date(),
			pieces: pcs,
			commonlayout,
			creator_id: details.creator_id,
		}

		return resJson
	})

	const newLayouts = layouts.filter((l) => !dbLayouts.some((dL) => dL.uuid === l.uuid)),
		deletedLayouts = dbLayouts.filter((dL) => !layouts.some((l) => l.uuid === dL.uuid)),
		existingLayouts = dbLayouts
			.filter((l) =>
				layouts.find(
					(dL) =>
						l.uuid === dL.uuid &&
						// Check if any of the fields changed, not only version string
						(JSON.stringify(dL.details) !== JSON.stringify(l.details) ||
							dL.baselayout !== l.baselayout ||
							JSON.stringify(dL.pieces) !== JSON.stringify(l.pieces) ||
							dL.commonlayout !== l.commonlayout ||
							dL.creator_id !== l.creator_id ||
							dL.version !== l.version)
				)
			)
			.map((dL) => layouts.find((l) => l.uuid === dL.uuid))

	let nL,
		dL = [],
		oL

	const cs = new pgp.helpers.ColumnSet(
		[
			{ name: 'uuid', cast: 'uuid' },
			{ name: 'details', cast: 'json' },
			'baselayout',
			'target',
			{ name: 'last_updated', cast: 'timestamp without time zone' },
			{ name: 'pieces', cast: 'json[]' },
			'commonlayout',
			'creator_id',
		],
		{
			table: 'layouts',
		}
	)

	if (newLayouts.length > 0) {
		console.log('\n---- newLayouts:')
		console.log(newLayouts.map((l) => l.details.name).join('\n'))

		const query = () => pgp.helpers.insert(newLayouts, cs)
		nL = db.none(query)
	}

	if (deletedLayouts.length > 0) {
		console.log('\n---- deletedLayouts:')
		dL = deletedLayouts.map((l) => {
			console.log(`${l.details.name}\n`)

			return db.none(
				`
					DELETE FROM layouts
					WHERE uuid = $1
				`,
				[l.uuid]
			)
		})
	}

	if (existingLayouts.length > 0) {
		console.log('\n---- existingLayouts:')
		console.log(existingLayouts.map((l) => l.details.name).join('\n'))

		const query = () => pgp.helpers.update(existingLayouts, cs) + ' where v.uuid = t.uuid'
		oL = db.none(query)
	}

	Promise.all([nL, ...dL, oL]).then(() => db.$pool.end())
}

run()
