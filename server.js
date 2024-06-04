// *** Express setup ***
import express from 'express'
import fetchJson from './helpers/fetch-json.js'

const app = express(),
apiUrl = 'https://fdnd-agency.directus.app/items';

app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('./public'))
app.use(express.urlencoded({extended: true}))

// *** Routes ***

//index
app.get('/', (req, res) => {
    Promise.all([
        fetchJson(apiUrl + '/anwb_week'),
        fetchJson(apiUrl + '/anwb_persons'),
        fetchJson(apiUrl + '/anwb_roles'),
    ]).then(([data_week, data_persons, data_roles]) => {
        res.render('index.ejs', {data_week, data_persons, data_roles})
    })
})

//login
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

//vakanties
app.get('/vakanties', (req, res) => {
    res.render('vakanties.ejs');
})

//mijnplanning
app.get('/mijnplanning', (req, res) => {
    res.render('mijnplanning.ejs');
})

app.listen(app.get('port'), () => {
    console.log(`Application started on http://localhost:${app.get('port')}`)
})