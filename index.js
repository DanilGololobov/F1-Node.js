const express = require('express');
const Sequelize = require('sequelize');
const hbs=require('hbs')
const bodyParser=require('body-parser')

const app = express();

app.set('view engine','hbs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.static('public'))


const sequelize = new Sequelize({
  storage: 'f1.db',
  dialect: 'sqlite',
});

const Team = sequelize.define('team', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING(200),
  },
  managerId: {
    type: Sequelize.INTEGER,
  },
  pilotId: {
    type: Sequelize.INTEGER,
  },
});

const Manager = sequelize.define('manager', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(200),
  },
});

const Pilot = sequelize.define('pilot', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(200),
  },
});

const TeamPilot = sequelize.define('team_pilot', {
  teamId: {
    type: Sequelize.INTEGER,
  },
  pilotId: {
    type: Sequelize.INTEGER,
  },
});



Team.belongsTo(Manager, { foreignKey: 'managerId' });
Manager.hasMany(Team, { foreignKey: 'managerId' });
Pilot.hasMany(TeamPilot, { foreignKey: 'pilotId' });
TeamPilot.belongsTo(Team, { foreignKey: 'teamId' });

sequelize.sync().then((result) => {
  console.log('DB is connected!');
});



// ////TEAM-----------------------------------------------------

app.post('/teams', async (req, res) => {
    try {
      const { title, managerId, pilotId } = req.body;
      const team = await Team.create({
        title,
        managerId,
        pilotId,
      });
      return res.render('teams.hbs', { team });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });


app.get('/teams', async (req, res) => {
  const teams = await Team.findAll({
    include: [
      {
        model: Manager,
      },
    ],
  });
  return res.render('teams.hbs',{teams,})
});


app.get('/teams/:id', async (req, res) => {
  try {
    const id = req.params.id;
  const team = await Team.findByPk(id);
  if (team) {
    return res.json(team);
  }
  res.statusCode = 404;
  res.json({
    error: 'no such team',
  }).end();
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.put('/teams/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const team = await Team.findByPk(id);
      if (!team) {
        return res.status(404).json({
          status: 404,
          message: 'Team not found',
        });
      }
      const { title, managerId, pilotId } = req.body;
      await team.update({
        title,
        managerId,
        pilotId,
      });
      return res.status(200).render('teams.hbs', {team});
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
  });


app.delete('/teams/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({
        status: 404,
        message: 'Team not found',
      });
    }
    await team.destroy();
    const teams = await Team.findAll({
      include: [
        {
          model: Manager,
        },
      ],
    });
  return res.render('teams.hbs', {teams})
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});




////MANAGER---------------------------------------------------

app.post('/managers', async (req, res) => {
  const { name } = req.body;
  const manager = await Manager.create({ name });
  return res.status(201).json({manager});
});

app.get('/managers', async (req, res) => {
  const managers = await Manager.findAll({
    include: [
      {
        model: Team,
      },
    ],
});
  return res.render('managers.hbs', {managers});
});


app.get('/managers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const manager = await Manager.findByPk(id);
    if(!manager){
      return res.status(404).json({
        status: 404,
        message: 'Manager not found',
      });
    }
    return res.render('manager.hbs', { manager });
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.put('/managers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const manager = await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({
        status: 404,
        message: 'Manager not found',
      });
    }
    const { name } = req.body;
    await manager.update({
      name
    });

    const managers = await Manager.findAll();
  return res.status(200).render('managers.hbs', {managers})

  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.delete('/managers/:id', async (req, res) => {
  try {
    const id = req.params.id; 
    const manager=await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({
        status: 404,
        message: 'Manager not found',
      });
    };

    await Team.destroy({
      where: {
        managerId: id,
      },
    });
    await Manager.destroy({
      where: {
        id,
      },
    });
    return res.status(200).json({
      message: 'ok',
    });
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});


// ///PILOT------------------------------------------------


app.post('/pilots', async (req, res) => {
  const name = req.body.name;
  const pilot = await Pilot.create({ name });
  const pilots = await Pilot.findAll();
  return res.status(201).render('pilots.hbs', {pilots})
});



app.get('/pilots/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const pilot = await Pilot.findByPk(id);
    if(!pilot){
      return res.status(404).json({
        status: 404,
        message: 'Pilot not found',
      });
    }
    const pilots = await Pilot.findAll({ raw: true });
    return res.render('pilot.hbs', { pilot, pilots });
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.put('/pilots/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const pilot = await Pilot.findByPk(id);
    if (!pilot) {
      return res.status(404).json({
        status: 404,
        message: 'pilot not found',
      });
    }
    const { name } = req.body;
    await pilot.update({
      name
    });
    const pilots = await Pilot.findAll();
  return res.status(200).render('pilots.hbs', {pilots})
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.delete('/pilots/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const pilot = await Pilot.findByPk(id);
    if (!pilot) {
      return res.status(404).json({
        status: 404,
        message: 'pilot not found',
      });
    }

    await Pilot.destroy({
    where: {
      id,
    },
  });
  const pilots = await Pilot.findAll();
  return res.status(201).render('pilots.hbs', {pilots})

  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }
});



app.listen(3001, () => {
  console.log('Server is started!');
})
