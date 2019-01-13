const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db =knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : 'SON@38abh',
        database : 'facerecog'
    }
});




const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
    users: [
        {
            id: '123',
            name: 'abhishek',
            email: 'abhishek@gmail.com',
            password: 'password1',
            entries :0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'yunsu',
            email: 'yunsu@gmail.com',
            password: 'password2',

            entries :0,
            joined: new Date()
        },
    ],
    login : [
        {
            id : '900',
            hash : '',
            email: 'abhishek@gmail.com'
        }
    ]
}

app.get('/',(req,res) => {
    res.send(database.users);

})


app.post('/signin',(req,res) => {
  db.select('email', 'hash').from('login')
      .where('email','=', req.body.email)
      .then(data => {
          const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
          if(isValid){
              return db.select('*').from('users')
                  .where('email', '=',req.body.email )
                  .then(user => {
                      res.json(user[0]);
                  })
                  .catch(err => res.json('unable to get the user'))
          }else {
              res.status(450).json('wrong cretentials')
          }
      })
      .catch(err => res.json('unable to get the user'))
})


app.post('/register',(req,res) => {
    const {email, name, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash : hash,
            email:email
        })
            .into('login')
            .returning('email')
            .then(loginEmail =>{
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0]);
                    })

            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err =>res.status(400).json("unable to register"))
})






app.get('/profile/:id',(req,res) =>{
    const {id} = req.params;
    let found = false;
    db.select('*').from('users').where({id})
        .then(user => {
            if(user.length>0){
                res.json(user[0])
            }
            else {
             res.status(450).json('not found');
            }
    })
        .catch(err => res.status(450).json("error getting user"))

})






app.put('/image',(req,res) =>{
    const {id} = req.body;
    db('users').where('id', '=', id)
        .increment('entries',1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
        })
        .catch(err => res.status(450).json("not updated the entries"))
    })






/*bcrypt.hash("password1", null, null, function(err, hash) {
    // Store hash in your password DB.
});

// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});
*/

app.listen(8000,()=>{
  console.log("The app is running on port 8000");
});

/*
/---> res = this is working
/signin ---> POST success/fail
/register---> POST = user
/profile/:userID ----->GET =user
/image ----> PUT --> user
 */