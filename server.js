// *** Express setup ***
import express from 'express'
import fetchJson from './helpers/fetch-json.js'
import getDateOfIsoWeek from './helpers/week-to-date.js';

const app = express(),
apiUrl = 'https://fdnd-agency.directus.app/items';

app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('./public'))
app.use(express.urlencoded({extended: true}))
app.locals.getDateOfIsoWeek = getDateOfIsoWeek;

// *** Routes ***

//index
app.get('/', (req, res) => {
    Promise.all([
        fetchJson(apiUrl + '/anwb_roles'),
        fetchJson(apiUrl + '/anwb_week?fields=*,assignments.*,assignments.anwb_assignments_id.*,assignments.anwb_assignments_id.role.anwb_roles_id,assignments.anwb_assignments_id.person.anwb_persons_id.name')
    ]).then(([{data: roles}, {data: weeks}]) => {
        res.render('index.ejs', {roles, weeks});
    })
})

app.post('/add_assignment/:week_id/:role_id', (req, res) => {
    fetchJson(apiUrl + `/anwb_week?filter={"id":${req.params.week_id}}&fields=assignments.anwb_assignments_id.role.anwb_roles_id,assignments.anwb_assignments_id.id`).then(({data: [{assignments}]}) => {
        console.log(assignments);
        if (assignments.length === 0) { //if there is no assignment
            // Patch a new asignment object to week
            fetchJson(apiUrl + '/anwb_week/'+req.params.week_id, {
                method: 'PATCH',
                headers:  { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "assignments": {
                        "create": [
                            {
                                "anwb_assignments_id": {
                                    "role": {
                                        "create": [
                                            {
                                                "anwb_assignments_id": "+",
                                                "anwb_roles_id": {
                                                    "id": req.params.role_id
                                                }
                                            }
                                        ]
                                    },
                                    "person": {
                                        "create": [
                                            {
                                                "anwb_assignments_id": "+",
                                                "anwb_persons_id": {
                                                    "id": 1 // TODO: Make a login
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                })
            }).then(console.log);
        } else {
            if (assignments[0].anwb_assignments_id.role.find(({anwb_roles_id}) => anwb_roles_id === req.params.role_id) !== undefined) {
                // if this role for this week is already taken
                res.redirect(209, '/');
                return;
            }
            // Update assignment object in week
            console.log(assignments[0]);
            fetchJson(apiUrl + '/anwb_assignments/'+assignments[0].anwb_assignments_id.id, {
                method: 'PATCH',
                headers:  { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "role": {
                        "create": [
                            {
                                "anwb_assignments_id": assignments[0].anwb_assignments_id.id,
                                "anwb_roles_id": {
                                    "id": req.params.role_id
                                }
                            }
                        ]
                    },
                    "person": {
                        "create": [
                            {
                                "anwb_assignments_id": assignments[0].anwb_assignments_id.id,
                                "anwb_persons_id": {
                                    "id": 1 // TODO: Make a login
                                }
                            }
                        ]
                    }
                })
            }).then(console.log);
        }
        res.redirect(301, '/');
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

//BRONNEN
//https://docs.directus.io/reference/introduction.html#relational-data
//https://docs.directus.io/reference/items.html#the-item-object
//https://docs.directus.io/reference/query.html#fields 