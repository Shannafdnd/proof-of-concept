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
app.use(session({ //this is for the login
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.locals.getDateOfIsoWeek = getDateOfIsoWeek; //give ejs files acces to the week-to-date helper
app.locals.dateFormat = {
    weekday: "short",
    day: "numeric",
    month: "long"
}

// *** Routes ***

//index
app.get('/', (req, res) => {
    if (req.session === undefined || req.session.userID === undefined) { //If the user has not logged in yet, it will give an undefined, and we redirect to login
        res.redirect(302, '/login')
    } else {
        Promise.all([
            fetchJson(apiUrl + '/anwb_roles'),
            fetchJson(weekUrl),
            fetchJson(apiUrl + `/anwb_week?filter={"assignments":{"anwb_assignments_id":{"person":{"anwb_persons_id":${req.session.userID}}}}}&fields=week,assignments.anwb_assignments_id.role.anwb_roles_id.role`), // fetch the upcomming assignments of logged in user
            fetchJson(apiUrl + '/anwb_persons/' + req.session.userID) // fetch username of logged in user
        ]).then(([{data: roles}, {data: weeks}, {data: upcomming}, {data: userData}]) => {
            res.render('index.ejs', {roles, weeks, upcomming, username: userData.name});
        })
    }
})

app.post('/add_assignment/:week_id/:role_id', (req, res) => { //post the logged in person on a specific role in a specific week
    fetchJson(apiUrl + `/anwb_week/${req.params.week_id}?fields=assignments.anwb_assignments_id.role.anwb_roles_id,assignments.anwb_assignments_id.id`).then(({data: {assignments}}) => {
        if (assignments.length === 0) { //if there is no assignment in this week
            // Create a new assignment object and patch it to the week
            fetchJson(apiUrl + '/anwb_week/'+req.params.week_id, { //fetch this week
                method: 'PATCH',
                headers:  { 'Content-Type': 'application/json' },
                body: JSON.stringify({ //in the body is the exact data which i copied from directus by recording what happens when you make a new assignment 
                    "assignments": {
                        "create": [
                            {
                                "anwb_assignments_id": {
                                    "role": {
                                        "create": [
                                            {
                                                "anwb_assignments_id": "+",
                                                "anwb_roles_id": {
                                                    "id": req.params.role_id //id of the role to be assigned
                                                }
                                            }
                                        ]
                                    },
                                    "person": {
                                        "create": [
                                            {
                                                "anwb_assignments_id": "+",
                                                "anwb_persons_id": {
                                                    "id": req.session.userID //id of logged in person
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
        } else { //if there are already assignments in this week, update it with a another role and person
            const assignment = assignments[0].anwb_assignments_id; //just to make it a bit more readable
            if (assignment.role.find(({anwb_roles_id}) => anwb_roles_id === req.params.role_id) !== undefined) { //try to find the role that will be assigned, if it is already taken, send 409
                res.status(409).send('Role already taken')
            } else {
                // Update assignment object with another role and person
                fetchJson(apiUrl + '/anwb_assignments/' + assignment.id, { //fetch assignments of week
                    method: 'PATCH',
                    headers:  { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ //also copied from directus
                        "role": { //add role
                            "create": [
                                {
                                    "anwb_assignments_id": assignment.id, //link to the right assignment id
                                    "anwb_roles_id": {
                                        "id": req.params.role_id //link the right role id
                                    }
                                }
                            ]
                        },
                        "person": { //add person
                            "create": [
                                {
                                    "anwb_assignments_id": assignment.id, //link to the right assignment
                                    "anwb_persons_id": {
                                        "id": req.session.userID //link id of logged in person
                                    }
                                }
                            ]
                        }
                    })
                })
            }
        }
        res.redirect(301, '/');
    })
})

//login
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.post('/login', (req, res) => {
    fetchJson(apiUrl + `/anwb_persons?filter={"name":"${req.body.username}"}`).then(({data}) => { //fetch the data of the person who logged in
        if (data === undefined || data.length === 0) { //if data is undefined or empty
            res.status(401).send('User not found'); //send user not found
        } else {
            req.session.userID = data[0].id //set session.userID to id of person who logged in
            res.redirect(301, '/')
        }
    })
})

//vakanties
app.get('/vakanties', (req, res) => {
    res.render('vakanties.ejs');
}) //TODO: add vakanties

//mijnplanning
app.get('/mijnplanning', (req, res) => {
    res.render('mijnplanning.ejs');
}) //TODO: add mijnplanning

app.listen(app.get('port'), () => {
    console.log(`Application started on http://localhost:${app.get('port')}`)
})

//BRONNEN
//https://docs.directus.io/reference/introduction.html#relational-data
//https://docs.directus.io/reference/items.html#the-item-object
//https://docs.directus.io/reference/query.html#fields 
//https://chatgpt.com/c/1774389b-08a6-4461-b68b-5dbf64212558
//https://www.npmjs.com/package/express-session
//https://expressjs.com/en/resources/middleware/session.html