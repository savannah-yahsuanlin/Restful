const Sequelize = require('sequelize');
const db = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/minipage');

const Page = db.define('page', {
	title: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			notEmpty: true
		}
	}
})

Page.belongsTo(Page, {as: 'parent'})
Page.hasMany(Page, {foreignKeys: 'parentId', as: 'children'})

const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/pages/:id', async(req, res, next) => {
	try {
		const page = await Page.findByPk(req.params.id,
		{
			include: [
			{
				model: Page,
				as: 'parent'
			},
			{
				model: Page,
				as: 'children'
			}	
			]
		});
		res.send(page)
	} catch (error) {
		next(error);
	}
});

app.get('/api/pages', async(req, res,	next)=>{
	try {
		res.send(await Page.findAll({
			include: [
			{
				model: Page,
				as: 'parent'
			}
			]
		}))
	} catch (error) {
		next(error);
	}
})

app.post('/api/pages', async(req, res, next) => {
	try {
		const page = await Page.create(req.body)
		res.status(201).send(page)
	} catch (error) {
		next(error);
	}
})

app.delete('/api/pages', async(req, res, next) => {
	try {
		const page = await Page.findByPk(req.params.id)
		await page.destroy()
		res.sendStatus(204)
	} catch (error) {
		next(error);
	}
})

app.put('/api/pages', async(req, res, next) => {
	try {
		const page = await Page.findByPk(req.params.id)
		await page.update(req.body)
		res.send(204)
	} catch (error) {
		next(error);
	}
})

const port = process.env.PORT || 3000

app.listen(port, async() => {
	try {
		await db.sync({force: true})
		const [home, about, contact, account] = await Promise.all([
			Page.create({title: 'Home'}),
			Page.create({title: 'about'}),
			Page.create({title: 'contact'}),
			Page.create({title: 'account'}),
		])

		about.parentId = home.id
		contact.parentId = home.id
		account.parentId = contact.id

		await Promise.all([
			about.save(),
			contact.save(),
			account.save(),
			Page.create({ title: 'shirts', parentId: home.id}),
			Page.create({ title: 'pants', parentId: home.id}),
			Page.create({ title: 'hats', parentId: home.id}),
		])
		console.log(`listening on ${port}`)
	} catch (error) {
		console.log(error)
	}
})