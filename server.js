// *** Express setup ***
import express from 'express'
import session from 'express-session'
import fetchJson from './helpers/fetch-json.js'
import getDateOfIsoWeek from './helpers/week-to-date.js';

const app = express(),
apiUrl = 'https://fdnd-agency.directus.app/items',
weekUrl = apiUrl + '/anwb_week?fields=*,assignments.*,assignments.anwb_assignments_id.*,assignments.anwb_assignments_id.role.anwb_roles_id,assignments.anwb_assignments_id.person.anwb_persons_id.name';

app.set('view engine', 'ejs')
app.set('views', './views')
app.set('port', process.env.PORT || 8000)
app.use(express.static('./public'))
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: 'SecretKey',
    resave: false,
    saveUninitialized: true
}));
app.locals.getDateOfIsoWeek = getDateOfIsoWeek;
app.locals.dateFormat = {
    weekday: "short",
    day: "numeric",
    month: "long"
}

// *** Routes ***

//index
app.get('/', (req, res) => {
    if (req.session.userID === undefined) {
        res.redirect(302, '/login')
    } else {
        Promise.all([
            fetchJson(apiUrl + '/anwb_roles'),
            fetchJson(weekUrl),
            fetchJson(apiUrl + `/anwb_week?filter={"assignments":{"anwb_assignments_id":{"person":{"anwb_persons_id":${req.session.userID}}}}}&fields=week,assignments.anwb_assignments_id.role.anwb_roles_id.role`),
            fetchJson(apiUrl + '/anwb_persons/'+req.session.userID)
        ]).then(([{data: roles}, {data: weeks}, {data: upcomming}, {data: {name: username}}]) => {
            res.render('index.ejs', {roles, weeks, upcomming, username});
        })
    }
})

app.post('/add_assignment/:week_id/:role_id', (req, res) => {
    fetchJson(apiUrl + `/anwb_week/${req.params.week_id}?fields=assignments.anwb_assignments_id.role.anwb_roles_id,assignments.anwb_assignments_id.id`).then(({data: {assignments}}) => {
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
                                                    "id": req.session.userID
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                })
            })
        } else { //if there is already an assignment, update it with a new role and person
            const assignment = assignments[0].anwb_assignments_id;
            if (assignment.role.find(({anwb_roles_id}) => anwb_roles_id === req.params.role_id) !== undefined) {
                // if this role for this week is already taken
                res.redirect(409, '/');
                return;
            }
            // Update assignment object in week
            fetchJson(apiUrl + '/anwb_assignments/' + assignment.id, {
                method: 'PATCH',
                headers:  { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "role": {
                        "create": [
                            {
                                "anwb_assignments_id": assignment.id,
                                "anwb_roles_id": {
                                    "id": req.params.role_id
                                }
                            }
                        ]
                    },
                    "person": {
                        "create": [
                            {
                                "anwb_assignments_id": assignment.id,
                                "anwb_persons_id": {
                                    "id": req.session.userID
                                }
                            }
                        ]
                    }
                })
            })
        }
        res.redirect(301, '/');
    })
})

//login
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.post('/login', (req, res) => {
    fetchJson(apiUrl + `/anwb_persons?filter={"name":"${req.body.username}"}`).then(({data}) => {
        if (!data || data.length === 0) {
            res.status(401).send('User not found');
        } else {
            req.session.userID = data[0].id
            res.redirect(301, '/')
        }
    })
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
//https://expressjs.com/en/resources/middleware/session.html