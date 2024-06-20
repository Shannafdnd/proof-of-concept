// *** Express setup ***
import express from 'express'
import fetchJson from './helpers/fetch-json.js'

const 
app = express(),
ApiUrl = 'https://fdnd-agency.directus.app/items/anwb_';

app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('./public'))
app.use(express.urlencoded({extended: true}))

// *** Routes ***

//Index route
app.get('/', (req,res) => {
    Promise.all([
        fetchJson(ApiUrl + 'roles'),
        fetchJson(ApiUrl + `week?fields=
        week,
        assignments.anwb_assignments_id.role.anwb_roles_id,
        assignments.anwb_assignments_id.person.anwb_persons_id.name`
        ),
    ]).then(([rolesData, weekData, upcommingData]) => {
        res.render('index', {rolesData, weekData,})
    })
})

//vakanties
app.get('/vakanties', (req, res) => {
    fetchJson(ApiUrl + 'persons?fields=vacation_days.anwb_vacation_days_id.day,name').then((vakantieData) => {
        res.render('vakanties.ejs', {vakantieData})
    })
})

app.listen(app.get('port'), () => {
    console.log(`Application started on http://localhost:${app.get('port')}`)
})